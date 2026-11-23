import React, { useCallback, useEffect, useState } from "react";
import "react-toastify/dist/ReactToastify.css";
import styles from "./SignUp.module.css";
import { ToastContainer } from "react-toastify";
import { notify } from "./toast";
import logo from "../img/logo.svg";
import {
  MODULES_UPDATED,
  SUBSCRIPTIONS_UPDATED,
  fetchModules,
  fetchSubscribedIds,
  subscribeToModule,
} from "../quizApi";

// Home page: modules the user has not subscribed to yet. Subscribed ones live in the side panel.
const Modules = () => {
  const [modules, setModules] = useState([]);
  const [subscribed, setSubscribed] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const loadSubscriptions = useCallback(async () => {
    try {
      setSubscribed(await fetchSubscribedIds());
    } catch (e) {
      notify("Could not load your subscriptions", "error");
    }
  }, []);

  const loadModules = useCallback(async () => {
    try {
      setModules(await fetchModules());
    } catch (e) {
      notify("Could not load modules", "error");
    }
  }, []);

  useEffect(() => {
    (async () => {
      await Promise.all([loadModules(), loadSubscriptions()]);
      setLoading(false);
    })();
  }, [loadModules, loadSubscriptions]);

  // Unsubscribing from the side panel (or an admin editing modules) refreshes this list.
  useEffect(() => {
    window.addEventListener(SUBSCRIPTIONS_UPDATED, loadSubscriptions);
    window.addEventListener(MODULES_UPDATED, loadModules);
    return () => {
      window.removeEventListener(SUBSCRIPTIONS_UPDATED, loadSubscriptions);
      window.removeEventListener(MODULES_UPDATED, loadModules);
    };
  }, [loadSubscriptions, loadModules]);

  const subscribe = async (module) => {
    setBusyId(module.id);
    try {
      await subscribeToModule(module.id);
      notify(`Subscribed to ${module.title}. Find it in the side panel.`, "success");
    } catch (e) {
      notify("Could not subscribe. Please try again.", "error");
    }
    setBusyId(null);
  };

  const available = modules.filter((m) => !subscribed.has(m.id));

  return (
    <div className={styles.container}>
      <form className={styles.formLogin} autoComplete="off" onSubmit={(e) => e.preventDefault()}>
        <img src={logo} alt="QuizBuddy" className={styles.logo} />
        <h2>Available Modules</h2>
        <div>
          {loading && <p>Loading...</p>}
          {!loading && modules.length === 0 && <p>No modules yet.</p>}
          {!loading && modules.length > 0 && available.length === 0 && (
            <p>You've subscribed to every module. Pick one from the side panel to start a test.</p>
          )}
          {available.map((module) => (
            <div key={module.id} className={styles.card}>
              <h2 className={styles.cardTitle}>{module.title}</h2>
              {module.description && <p>{module.description}</p>}
              <button
                type="button"
                onClick={() => subscribe(module)}
                disabled={busyId === module.id}
                className={styles.button}
              >
                {busyId === module.id ? "Subscribing..." : "Subscribe"}
              </button>
            </div>
          ))}
        </div>
      </form>
      <ToastContainer />
    </div>
  );
};

export default Modules;
