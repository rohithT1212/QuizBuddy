import React, { useEffect, useState } from "react";
import "react-toastify/dist/ReactToastify.css";
import styles from "./SignUp.module.css";
import { ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { notify } from "./toast";

const pct = (score, total) => (total ? Math.round((score / total) * 100) : 0);

// Lists the signed-in user's attempts, grouped by module. RLS limits rows to the user's own.
const History = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // 1000-row API cap: page through attempts, newest first.
      const rows = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase
          .from("attempts")
          .select("id, module_id, score, total, created_at, modules(title)")
          .order("created_at", { ascending: false })
          .range(from, from + 999);
        if (error) {
          notify("Could not load your scores", "error");
          setLoading(false);
          return;
        }
        rows.push(...data);
        if (data.length < 1000) break;
      }

      const byModule = new Map();
      rows.forEach((a) => {
        if (!byModule.has(a.module_id)) {
          byModule.set(a.module_id, {
            moduleId: a.module_id,
            title: a.modules?.title || "Module",
            attempts: [],
          });
        }
        byModule.get(a.module_id).attempts.push(a);
      });
      setGroups(Array.from(byModule.values()));
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className={styles.container}>
      <form
        className={`${styles.formLogin} ${styles.testCard}`}
        onSubmit={(e) => e.preventDefault()}
      >
        <h2>My Scores</h2>

        {loading && <p>Loading...</p>}
        {!loading && groups.length === 0 && (
          <p>No attempts yet. Take a test from the modules page.</p>
        )}

        {groups.map((g) => {
          const best = Math.max(...g.attempts.map((a) => pct(a.score, a.total)));
          return (
            <details key={g.moduleId} className={styles.card}>
              <summary className={styles.historySummary}>
                <strong>{g.title}</strong>
                <span>
                  {g.attempts.length} attempt{g.attempts.length === 1 ? "" : "s"} · best {best}%
                </span>
              </summary>
              {g.attempts.map((a) => (
                <div key={a.id} className={styles.attemptRow}>
                  <span>{new Date(a.created_at).toLocaleString()}</span>
                  <span>
                    {a.score} / {a.total} ({pct(a.score, a.total)}%)
                  </span>
                </div>
              ))}
            </details>
          );
        })}

        <button
          type="button"
          className={styles.buttonSecondary}
          onClick={() => navigate("/modules")}
        >
          Back to modules
        </button>
      </form>
      <ToastContainer />
    </div>
  );
};

export default History;
