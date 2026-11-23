import React, { useCallback, useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import styles from "./Sidebar.module.css";
import logo from "../img/logo.svg";
import { supabase } from "../supabaseClient";
import {
  ATTEMPTS_UPDATED,
  MODULES_UPDATED,
  SUBSCRIPTIONS_UPDATED,
  fetchAllQuestions,
  fetchAttemptStats,
  fetchIsAdmin,
  fetchModules,
  fetchSubscribedIds,
  unsubscribeFromModule,
} from "../quizApi";
import { notify } from "./toast";

// Side panel: the user's subscribed modules with best score and attempts, one click to start.
const Sidebar = ({ open, onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [modules, setModules] = useState([]);
  const [subscribed, setSubscribed] = useState(new Set());
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(null); // module id being loaded
  const [isAdmin, setIsAdmin] = useState(false);

  const loadModules = useCallback(async () => {
    try {
      setModules(await fetchModules());
    } catch (e) {
      notify("Could not load modules", "error");
    }
  }, []);

  useEffect(() => {
    fetchIsAdmin().then(setIsAdmin);
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setStats(await fetchAttemptStats());
    } catch (e) {
      /* scores are a nicety; the module list still works */
    }
  }, []);

  const loadSubscriptions = useCallback(async () => {
    try {
      setSubscribed(await fetchSubscribedIds());
    } catch (e) {
      notify("Could not load your subscriptions", "error");
    }
  }, []);

  useEffect(() => {
    (async () => {
      await Promise.all([loadModules(), loadSubscriptions(), loadStats()]);
      setLoading(false);
    })();
  }, [loadModules, loadStats, loadSubscriptions]);

  // Refresh when a test is submitted, the user (un)subscribes, or an admin edits modules.
  useEffect(() => {
    const onModules = () => {
      loadModules();
      loadSubscriptions();
    };
    window.addEventListener(ATTEMPTS_UPDATED, loadStats);
    window.addEventListener(SUBSCRIPTIONS_UPDATED, loadSubscriptions);
    window.addEventListener(MODULES_UPDATED, onModules);
    return () => {
      window.removeEventListener(ATTEMPTS_UPDATED, loadStats);
      window.removeEventListener(SUBSCRIPTIONS_UPDATED, loadSubscriptions);
      window.removeEventListener(MODULES_UPDATED, onModules);
    };
  }, [loadModules, loadStats, loadSubscriptions]);

  const mine = modules.filter((m) => subscribed.has(m.id));

  const activeModuleId =
    location.pathname === "/test" ? location.state?.moduleId : null;

  // Test sets this flag while leaving would lose answers; ask before navigating away.
  const confirmLeave = () =>
    document.body.dataset.testInProgress !== "1" ||
    window.confirm("Leave this test? Your answers so far will be lost.");

  // Wraps a link's onClick: cancels navigation if the user chooses to stay.
  const guardLeave = (after) => (e) => {
    if (!confirmLeave()) {
      e.preventDefault();
      return;
    }
    if (after) after();
  };

  const startTest = async (module) => {
    if (!confirmLeave()) return;
    setStarting(module.id);
    try {
      const data = await fetchAllQuestions(module.id);
      navigate("/test", {
        state: { moduleId: module.id, sheetName: module.title, data },
      });
      if (onNavigate) onNavigate();
    } catch (e) {
      notify("Could not load questions", "error");
    }
    setStarting(null);
  };

  const unsubscribe = async (module) => {
    if (module.id === activeModuleId && !confirmLeave()) return;
    if (!window.confirm(`Unsubscribe from "${module.title}"? Your past scores are kept.`)) return;
    try {
      await unsubscribeFromModule(module.id);
    } catch (e) {
      notify("Could not unsubscribe", "error");
    }
  };

  const logout = async () => {
    if (!confirmLeave()) return;
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <nav
      className={`${styles.sidebar} ${open ? styles.open : ""}`}
      aria-label="Modules and scores"
    >
      <div className={styles.brand}>
        <img src={logo} alt="" />
        <span>QuizBuddy</span>
      </div>

      <div className={styles.links}>
        <NavLink to="/modules" onClick={guardLeave(onNavigate)} className={styles.link}>
          Home
        </NavLink>
        <NavLink to="/history" onClick={guardLeave(onNavigate)} className={styles.link}>
          My scores
        </NavLink>
        {isAdmin && (
          <NavLink to="/admin" onClick={guardLeave(onNavigate)} className={styles.link}>
            Admin: manage modules
          </NavLink>
        )}
      </div>

      <div className={styles.heading}>My modules</div>
      <div className={styles.list}>
        {loading && <p className={styles.muted}>Loading...</p>}
        {!loading && mine.length === 0 && (
          <p className={styles.muted}>
            No subscriptions yet. Subscribe to modules from Home.
          </p>
        )}
        {mine.map((m) => {
          const s = stats[m.id];
          return (
            <div key={m.id} className={styles.moduleRow}>
              <button
                type="button"
                className={`${styles.module} ${activeModuleId === m.id ? styles.active : ""}`}
                onClick={() => startTest(m)}
                disabled={starting === m.id}
              >
                <span className={styles.moduleTitle}>{m.title}</span>
                <span className={styles.moduleMeta}>
                  {starting === m.id
                    ? "Loading..."
                    : s
                    ? `Best ${s.bestPct}% · ${s.count} attempt${s.count === 1 ? "" : "s"}`
                    : "Not attempted"}
                </span>
                {s && (
                  <span className={styles.bar} aria-hidden="true">
                    <span style={{ width: `${s.bestPct}%` }} />
                  </span>
                )}
              </button>
              <button
                type="button"
                className={styles.remove}
                onClick={() => unsubscribe(m)}
                aria-label={`Unsubscribe from ${m.title}`}
                title="Unsubscribe"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <button type="button" className={styles.logout} onClick={logout}>
        Log out
      </button>
    </nav>
  );
};

export default Sidebar;
