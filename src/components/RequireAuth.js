import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

// Renders children only when a Supabase session exists; otherwise redirects to /login.
const RequireAuth = ({ children }) => {
  const [session, setSession] = useState(undefined); // undefined = still loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) =>
      setSession(s)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) return null;
  return session ? children : <Navigate to="/login" replace />;
};

export default RequireAuth;
