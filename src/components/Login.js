import React, { useState, useEffect } from "react";
import emailIcon from "../img/email.svg";
import passwordIcon from "../img/password.svg";
import styles from "./SignUp.module.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { notify } from "./toast";
import { Link,useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleSpreadsheet } from "google-spreadsheet";
import bcrypt from "bcryptjs-react";

const Login = () => {
  const baseUrl = process.env.REACT_APP_BASE_URL;
  const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
  const API_KEY = process.env.REACT_APP_API_KEY;
  const SCOPES = process.env.REACT_APP_SCOPES;
  const SPREADSHEET_ID = process.env.REACT_APP_SPREADSHEET_ID; // extracted from the URL
  const SHEET_NAME = process.env.SHEET_NAME // or whatever your tab name is
  const SHEET_ID = process.env.REACT_APP_SHEETID;
  const CLIENT_EMAIL = process.env.REACT_APP_CLIENT_EMAIL;
  const PRIVATE_KEY = process.env.REACT_APP_PRIVATE_KEY.replace(/\\n/g, '\n');
  const navigate = useNavigate();



  const [data, setData] = useState({
    email: "",
    password: "",
  });

  const [touched, setTouched] = useState({});

  const chaeckData = async (obj) => {
    debugger;
    const baseUrl = process.env.REACT_APP_BASE_URL;
    const sheetUrl = `${baseUrl}`;
    const formData = {
      Email: data.email.toLowerCase(),
      Password: data.password,
      Operation: "USER LOGIN",
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
    const api = await fetch(sheetUrl, req);
    const res = await api.json();
    console.log(res);
    toast.promise(api, {
      pending: "Loading your data...",
      success: false,
      error: "Something went wrong!",
    });
  };

  const checkData = async (obj) => {
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
      const rows = await sheet.getRows();

      const userRow = rows.find(row => row.Email === data.email.toLowerCase());

      if (!userRow) {
        notify("User not found", "error");
      }

      const isMatch = bcrypt.compareSync(data.password, userRow.Password);
      if (isMatch) {
        notify("Successful login", "success");
        navigate("/modules");
      } else {
        notify("Invalid Username or password", "error");
      }
    } catch (e) {
      console.error('Error: ', e);
    }  
  };

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
    checkData(data);
  };

  return (
    <div className={styles.container}>
      <form
        className={styles.formLogin}
        onSubmit={submitHandler}
        autoComplete="off"
      >
        <h2>Sign In</h2>
        <div>
          <div>
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
        </div>
        <div>
          <div>
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
        </div>

        <div>
          <button type="submit">Login</button>
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
