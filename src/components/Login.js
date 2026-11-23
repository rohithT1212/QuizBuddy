import React, { useEffect, useState } from "react";
import emailIcon from "../img/email.svg";
import passwordIcon from "../img/password.svg";
import logo from "../img/logo.svg";
import styles from "./SignUp.module.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { notify } from "./toast";
import { validate } from "./validate";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

// Turn Supabase auth errors into messages a user can act on.
const friendlyAuthError = (error) => {
  const code = error.code || "";
  const message = (error.message || "").toLowerCase();

  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "Your email isn't confirmed yet. Check your inbox for the confirmation link.";
  }
  if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return "Incorrect email or password. If you haven't created an account yet, sign up first.";
  }
  if (code === "over_request_rate_limit" || error.status === 429) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (message.includes("invalid api key") || message.includes("apikey")) {
    return "App configuration error (invalid Supabase key). Check your .env file.";
  }
  if (error.name === "AuthRetryableFetchError" || message.includes("failed to fetch")) {
    return "Can't reach the server. Check your internet connection and the Supabase URL.";
  }
  return error.message || "Something went wrong. Please try again.";
};

const Login = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [data, setData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    setErrors(validate(data, "login"));
  }, [data]);

  const changeHandler = (event) => {
    setData({ ...data, [event.target.name]: event.target.value });
  };

  // Show a field's error once the user has left it.
  const blurHandler = (event) => {
    setTouched({ ...touched, [event.target.name]: true });
  };

  const submitHandler = async (event) => {
    event.preventDefault();

    if (Object.keys(errors).length) {
      setTouched({ email: true, password: true });
      notify("Please fix the highlighted fields", "error");
      return;
    }

    if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
      notify("App configuration error: Supabase URL or key is missing in .env", "error");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });
      if (error) {
        notify(friendlyAuthError(error), "error");
      } else {
        notify("Successful login", "success");
        navigate("/modules");
      }
    } catch (e) {
      notify(friendlyAuthError(e), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (name) =>
    errors[name] && touched[name]
      ? styles.unCompleted
      : !errors[name] && touched[name]
      ? styles.completed
      : undefined;

  return (
    <div className={styles.container}>
      <form
        className={styles.formLogin}
        onSubmit={submitHandler}
        autoComplete="off"
        noValidate
      >
        <img src={logo} alt="QuizBuddy" className={styles.logo} />
        <h2>Sign In</h2>
        <div>
          <div className={fieldClass("email")}>
            <input
              type="email"
              name="email"
              value={data.email}
              placeholder="E-mail"
              onChange={changeHandler}
              onBlur={blurHandler}
              autoComplete="email"
            />
            <img src={emailIcon} alt="" />
          </div>
          {errors.email && touched.email && (
            <span className={styles.error}>{errors.email}</span>
          )}
        </div>
        <div>
          <div className={fieldClass("password")}>
            <input
              type="password"
              name="password"
              value={data.password}
              placeholder="Password"
              onChange={changeHandler}
              onBlur={blurHandler}
              autoComplete="current-password"
            />
            <img src={passwordIcon} alt="" />
          </div>
          {errors.password && touched.password && (
            <span className={styles.error}>{errors.password}</span>
          )}
        </div>

        <div>
          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Login"}
          </button>
          <span
            style={{
              color: "#a29494",
              textAlign: "center",
              display: "inline-block",
              width: "100%",
            }}
          >
            Don't have a account? <Link to="/signup">Create account</Link>
          </span>
        </div>
      </form>
      <ToastContainer />
    </div>
  );
};

export default Login;
