import "react-toastify/dist/ReactToastify.css";
import styles from "./SignUp.module.css";
import { ToastContainer } from "react-toastify";
import { useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";


const Test = () => {
  const location = useLocation();
  const { sheetName, data } = location.state || {};
  const [answers, setAnswers] = useState([]);
  const[showScore,setShowScore] = useState(false);
  const[score,setScore] = useState(0);

  if (!data || data.length === 0) return <p>No data to display.</p>;

  const testQuestions = data;

  const handleChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    console.log(answers);
  };

    const calculateScore = () => {
        debugger;
        var finalScore = 0
        for (let questionId in answers) {
            if (testQuestions[questionId].row[5] === answers[questionId]) {
                finalScore++;
            }
        }
        setScore(finalScore);
        setShowScore(true);
        return score;
    };

  return (
    <div className={styles.container}>
      <form
        className={styles.formLogin}
        autoComplete="off"
      >
        <div>
            <h2 className="text-xl font-semibold">{sheetName}</h2>
            <br /> <br /> 
            {testQuestions.map((question,index) => (
            <div key={question.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
                <p>{question.row[0]}</p>
                <div className="radio">
                    <label>
                        <input type="radio" value={question.row[1]} name={question.id} onChange={() => handleChange(question.id, "A")}/>
                        {question.row[1]}
                    </label>
                </div>
                <div className="radio">
                    <label>
                        <input type="radio" value={question.row[2]} name={question.id}  onChange={() => handleChange(question.id, "B")}/>
                        {question.row[2]}
                    </label>
                </div>
                <div className="radio">
                    <label>
                        <input type="radio" value={question.row[3]} name={question.id} onChange={() => handleChange(question.id,"C")}/>
                        {question.row[3]}
                    </label>
                </div>
                <div className="radio">
                    <label>
                        <input type="radio" value={question.row[4]} name={question.id} onChange={() => handleChange(question.id, "D")}/>
                        {question.row[4]}
                    </label>
                </div>

                <br /> <br />      
            </div>
            ))}
            <br /> <br /> 

            <button type="button" onClick ={() => calculateScore()} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Submit
            </button>
            <br /> <br />    
            <div id="score" style={showScore ? {} : { display: 'none' }}>
                <p>Your final score is {score}.</p>
            </div>

        </div>

      </form>
      <ToastContainer />


    </div>
    
    );
};

export default Test;