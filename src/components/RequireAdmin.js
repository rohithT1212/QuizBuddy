import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { fetchIsAdmin } from "../quizApi";

// Only admins reach the nested routes; everyone else goes back to Home.
// (The database enforces this too; this just keeps the UI tidy.)
const RequireAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(undefined); // undefined = still checking

  useEffect(() => {
    fetchIsAdmin().then(setIsAdmin);
  }, []);

  if (isAdmin === undefined) return null;
  return isAdmin ? <Outlet /> : <Navigate to="/modules" replace />;
};

export default RequireAdmin;
