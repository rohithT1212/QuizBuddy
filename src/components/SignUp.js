import React, { useEffect, useState } from "react";
//Icon
import userIcon from "../img/user.svg";
import emailIcon from "../img/email.svg";
import passwordIcon from "../img/password.svg";
// Validate
import { validate } from "./validate";
// Styles
import styles from "./SignUp.module.css";
import "react-toastify/dist/ReactToastify.css";
// Toast
import { ToastContainer, toast } from "react-toastify";
import { notify } from "./toast";
//
import { Link } from "react-router-dom";
// Axios
import axios from "axios";
import { gapi } from "gapi-script";
import { GoogleSpreadsheet } from "google-spreadsheet";
import bcrypt from "bcryptjs-react";

const SignUp = () => {
  const baseUrl = process.env.REACT_APP_BASE_URL;
  const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
  const API_KEY = process.env.REACT_APP_API_KEY;
  const SCOPES = process.env.REACT_APP_SCOPES;
  const SPREADSHEET_ID = process.env.REACT_APP_SPREADSHEET_ID; // extracted from the URL
  const SHEET_NAME = process.env.SHEET_NAME // or whatever your tab name is
  const SHEET_ID = process.env.REACT_APP_SHEETID;
  const CLIENT_EMAIL = process.env.REACT_APP_CLIENT_EMAIL;
  const PRIVATE_KEY = process.env.REACT_APP_PRIVATE_KEY.replace(/\\n/g, '\n');

  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    IsAccepted: false,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    setErrors(validate(data, "signUp"));
  }, [data, touched]);

  const changeHandler = (event) => {
    if (event.target.name === "IsAccepted") {
      setData({ ...data, [event.target.name]: event.target.checked });
    } else {
      setData({ ...data, [event.target.name]: event.target.value });
    }
  };

  const focusHandler = (event) => {
    setTouched({ ...touched, [event.target.name]: true });
  };

  const submitHandler = (event) => {
    event.preventDefault();
    if (!Object.keys(errors).length) {
      debugger;
      const sheetUrl = `${baseUrl}`;
      const formData = {
        Name: data.name,
        Email: data.email.toLowerCase(),
        Password: data.password,
        Operation: "ADD USER",
      };
      var req = {
        redirect: "follow",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        //mode: "no-cors",
        muteHttpExceptions: true,
      };
      const pushData = async () => {
        await fetch(sheetUrl, req);
      };
      try {
        pushData();
        notify("User created successfully", "success");
      } catch (error) {
        notify("error", "error");
      }
    } else {
      notify("Please Check fields again", "error");
      setTouched({
        name: true,
        email: true,
        password: true,
        confirmPassword: true,
        IsAccepted: false,
      });
    }
  };

  const submitHandlerGapi = (event) => {
    event.preventDefault();
    if (!Object.keys(errors).length) {
      debugger;
      addRowToSheet([data.name,data.email.toLowerCase(),data.password]);
    } else {
      notify("Please Check fields again", "error");
      setTouched({
        name: true,
        email: true,
        password: true,
        confirmPassword: true,
        IsAccepted: false,
      });
    }
  };

  const submitHandlerGS = (event) => {
    event.preventDefault();
    if (!Object.keys(errors).length) {
      debugger;
      var salt = bcrypt.genSaltSync(10);
      var hash = bcrypt.hashSync(data.password, salt);
      const newRow = { Name: data.name, Email: data.email.toLowerCase(), Password:hash};
      appendSpreadsheet (newRow);
      notify("User created successfully", "success");
    } else {
      notify("Please Check fields again", "error");
      setTouched({
        name: true,
        email: true,
        password: true,
        confirmPassword: true,
        IsAccepted: false,
      });
    }
  };

  const appendSpreadsheet = async (row) => {
    debugger;
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
    try {
      await doc.useServiceAccountAuth({
        client_email: CLIENT_EMAIL,
        private_key: PRIVATE_KEY
      });
      // loads document properties and worksheets
      await doc.loadInfo();
      debugger;
      const sheet = doc.sheetsById[SHEET_ID];
      const result = await sheet.addRow(row);
    } catch (e) {
      console.error('Error: ', e);
    }
  };


  useEffect(() => {
    const initClient = () => {
      gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: [
          "https://sheets.googleapis.com/$discovery/rest?version=v4",
        ],
        scope: SCOPES,
      });
    };
    gapi.load("client:auth2", initClient);
  }, []);

  const signIn = () => {
    gapi.auth2.getAuthInstance().signIn();
  };

  const addRowToSheet = async (dataRow) => {
    try {
      gapi.auth2.getAuthInstance().signIn();
      const response = await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        resource: {
          values: [dataRow], // example: ['John Doe', 'john@example.com']
        },
      });
      notify("User created successfully", "success");
    } catch (err) {
      console.error("Unable to create user:", err);
    }
  };

  return (
    <div className={styles.container}>
      <form
        className={styles.formLogin}
        onSubmit={submitHandlerGS}
        autoComplete="off"
      >
        <h2>Sign Up</h2>
        <div>
          <div
            className={
              errors.name && touched.name
                ? styles.unCompleted
                : !errors.name && touched.name
                ? styles.completed
                : undefined
            }
          >
            <input
              type="text"
              name="name"
              value={data.name}
              placeholder="Name"
              onChange={changeHandler}
              onFocus={focusHandler}
              autoComplete="off"
            />
            <img src={userIcon} alt="" />
          </div>
          {errors.name && touched.name && (
            <span className={styles.error}>{errors.name}</span>
          )}
        </div>
        <div>
          <div
            className={
              errors.email && touched.email
                ? styles.unCompleted
                : !errors.email && touched.email
                ? styles.completed
                : undefined
            }
          >
            <input
              type="text"
              name="email"
              value={data.email}
              placeholder="E-mail"
              onChange={changeHandler}
              onFocus={focusHandler}
              autoComplete="off"
            />
            <img src={emailIcon} alt="" />
          </div>
          {errors.email && touched.email && (
            <span className={styles.error}>{errors.email}</span>
          )}
        </div>
        <div>
          <div
            className={
              errors.password && touched.password
                ? styles.unCompleted
                : !errors.password && touched.password
                ? styles.completed
                : undefined
            }
          >
            <input
              type="password"
              name="password"
              value={data.password}
              placeholder="Password"
              onChange={changeHandler}
              onFocus={focusHandler}
              autoComplete="off"
            />
            <img src={passwordIcon} alt="" />
          </div>
          {errors.password && touched.password && (
            <span className={styles.error}>{errors.password}</span>
          )}
        </div>
        <div>
          <div
            className={
              errors.confirmPassword && touched.confirmPassword
                ? styles.unCompleted
                : !errors.confirmPassword && touched.confirmPassword
                ? styles.completed
                : !errors.confirmPassword && touched.confirmPassword
                ? styles.completed
                : undefined
            }
          >
            <input
              type="password"
              name="confirmPassword"
              value={data.confirmPassword}
              placeholder="Confirm Password"
              onChange={changeHandler}
              onFocus={focusHandler}
              autoComplete="off"
            />
            <img src={passwordIcon} alt="" />
          </div>
          {errors.confirmPassword && touched.confirmPassword && (
            <span className={styles.error}>{errors.confirmPassword}</span>
          )}
        </div>
        <div>
          <div className={styles.terms}>
            <input
              type="checkbox"
              name="IsAccepted"
              value={data.IsAccepted}
              id="accept"
              onChange={changeHandler}
              onFocus={focusHandler}
            />
            <label htmlFor="accept">I accept terms of privacy policy</label>
          </div>
          {errors.IsAccepted && touched.IsAccepted && (
            <span className={styles.error}>{errors.IsAccepted}</span>
          )}
        </div>
        <div>
          <button type="submit">Create Account</button>
          <span
            style={{
              color: "#a29494",
              textAlign: "center",
              display: "inline-block",
              width: "100%",
            }}
          >
            Already have a account? <Link to="/login">Sign In</Link>
          </span>
        </div>
      </form>
      <ToastContainer />
    </div>
  );
};

export default SignUp;
