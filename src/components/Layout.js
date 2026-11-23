import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import styles from "./Sidebar.module.css";

// Shell for signed-in pages: side panel on the left, page content on the right.
const Layout = () => {
  const [open, setOpen] = useState(false); // drawer state on small screens
  const location = useLocation();

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [location.key]);

  return (
    <div className={styles.shell}>
      <button
        type="button"
        className={styles.menuBtn}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open modules and scores"}
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div
        className={`${styles.backdrop} ${open ? styles.open : ""}`}
        onClick={() => setOpen(false)}
      />
      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
