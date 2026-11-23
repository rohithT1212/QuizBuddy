import "react-toastify/dist/ReactToastify.css";
import styles from "./SignUp.module.css";
import { ToastContainer } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { ATTEMPTS_UPDATED } from "../quizApi";
import { notify } from "./toast";

const OPTIONS = [
  ["A", "option_a"],
  ["B", "option_b"],
  ["C", "option_c"],
  ["D", "option_d"],
];

const Test = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { moduleId, sheetName, data } = location.state || {};
  const [answers, setAnswers] = useState({}); // question id -> "A".."D"
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPalette, setShowPalette] = useState(false); // collapsible on phones

  // Flag for the side panel: leaving now would lose unsubmitted answers.
  const inProgress = Object.keys(answers).length > 0 && !result;
  useEffect(() => {
    if (inProgress) document.body.dataset.testInProgress = "1";
    else delete document.body.dataset.testInProgress;
    return () => {
      delete document.body.dataset.testInProgress;
    };
  }, [inProgress]);

  if (!data || data.length === 0) return <p>No data to display.</p>;

  const total = data.length;
  const question = data[current];
  const answeredCount = Object.keys(answers).length;
  const isLast = current === total - 1;

  const select = (letter) =>
    setAnswers((prev) => ({ ...prev, [question.id]: letter }));

  const clearAnswer = () =>
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[question.id];
      return next;
    });

  const goTo = (index) => {
    setCurrent(index);
    setShowPalette(false);
  };

  // Scoring happens in the database (submit_attempt) so answers never reach the browser.
  const submit = async () => {
    const unanswered = total - answeredCount;
    if (
      unanswered > 0 &&
      !window.confirm(`${unanswered} question(s) are unanswered. Submit anyway?`)
    ) {
      return;
    }
    setSubmitting(true);
    const { data: rows, error } = await supabase.rpc("submit_attempt", {
      p_module_id: moduleId,
      p_answers: answers,
    });
    setSubmitting(false);
    if (error) {
      notify("Could not submit your answers", "error");
      return;
    }
    setResult(rows[0]);
    window.dispatchEvent(new Event(ATTEMPTS_UPDATED)); // refresh scores in the side panel
  };

  const palette = (
    <div className={styles.palette} aria-label="Question navigator">
      {data.map((q, i) => {
        const classes = [styles.paletteBtn];
        if (answers[q.id]) classes.push(styles.answered);
        if (i === current) classes.push(styles.currentQ);
        return (
          <button
            type="button"
            key={q.id}
            className={classes.join(" ")}
            onClick={() => goTo(i)}
            title={answers[q.id] ? "Answered" : "Not answered"}
            aria-label={`Question ${i + 1}, ${answers[q.id] ? "answered" : "not answered"}`}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={styles.container}>
      <form
        className={`${styles.formLogin} ${styles.testCard}`}
        autoComplete="off"
        onSubmit={(e) => e.preventDefault()}
      >
        <h2>{sheetName}</h2>

        {result && (
          <div className={styles.scoreBox} id="score">
            <p>
              Your final score is {result.score} / {result.total}.
            </p>
            <button
              type="button"
              onClick={() => navigate("/modules")}
              className={styles.button}
            >
              Back to modules
            </button>
            <button
              type="button"
              onClick={() => navigate("/history")}
              className={styles.buttonSecondary}
            >
              View my scores
            </button>
          </div>
        )}

        <div className={styles.progress}>
          <span>
            Question {current + 1} of {total}
          </span>
          <span>
            {answeredCount} answered / {total - answeredCount} left
          </span>
        </div>

        <div className={styles.card}>
          <p>{question.prompt}</p>
          {OPTIONS.map(([letter, field]) => (
            <div className="radio" key={letter}>
              <label>
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  value={letter}
                  checked={answers[question.id] === letter}
                  disabled={!!result}
                  onChange={() => select(letter)}
                />{" "}
                {question[field]}
              </label>
            </div>
          ))}
          {answers[question.id] && !result && (
            <button type="button" className={styles.linkBtn} onClick={clearAnswer}>
              Clear answer
            </button>
          )}
        </div>

        <div className={styles.navRow}>
          <button
            type="button"
            className={styles.buttonSecondary}
            onClick={() => goTo(current - 1)}
            disabled={current === 0}
          >
            ‹ Previous
          </button>
          {!isLast && (
            <button
              type="button"
              className={styles.button}
              onClick={() => goTo(current + 1)}
            >
              Next ›
            </button>
          )}
          {isLast && !result && (
            <button
              type="button"
              className={styles.button}
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>

        <button
          type="button"
          className={`${styles.linkBtn} ${styles.paletteToggle}`}
          onClick={() => setShowPalette((s) => !s)}
        >
          {showPalette ? "Hide" : "Show"} all questions
        </button>
        <div className={showPalette ? styles.paletteWrap : styles.paletteWrapDesktop}>
          <div className={styles.legend}>
            <span className={`${styles.paletteBtn} ${styles.answered}`}>1</span> Answered
            <span className={styles.paletteBtn}>2</span> Not answered
            <span className={`${styles.paletteBtn} ${styles.currentQ}`}>3</span> Current
          </div>
          {palette}
        </div>
      </form>
      <ToastContainer />
    </div>
  );
};

// Re-mount per navigation so picking another module from the side panel starts fresh.
const TestRoute = () => {
  const location = useLocation();
  return <Test key={location.key} />;
};

export default TestRoute;
