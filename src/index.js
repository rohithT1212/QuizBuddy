import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { HashRouter } from "react-router-dom";
import { initTheme } from "./theme";

initTheme(); // set data-theme before first render to avoid a flash

ReactDOM.render(
  <HashRouter base="/">
    <App />
  </HashRouter>,
  document.getElementById("root")
);
