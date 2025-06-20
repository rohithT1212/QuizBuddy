import SignUp from "./components/SignUp";
import Login from "./components/Login";
import Modules from "./components/Modules"
import Test from "./components/Test";
import {Routes,Route,Navigate } from "react-router-dom";

function App() {
  return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/modules" element={<Modules />} />
        <Route path="/test" element={<Test />} />
        <Route path="/" element={<SignUp />} />
      </Routes>
  );
}

export default App;
