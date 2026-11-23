import SignUp from "./components/SignUp";
import Login from "./components/Login";
import Modules from "./components/Modules";
import Test from "./components/Test";
import History from "./components/History";
import Admin from "./components/Admin";
import RequireAdmin from "./components/RequireAdmin";
import RequireAuth from "./components/RequireAuth";
import Layout from "./components/Layout";
import ThemeToggle from "./components/ThemeToggle";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <ThemeToggle />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        {/* Signed-in pages share the side panel (modules, scores, home, log out). */}
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="/modules" element={<Modules />} />
          <Route path="/test" element={<Test />} />
          <Route path="/history" element={<History />} />
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>
        <Route path="/" element={<SignUp />} />
      </Routes>
    </>
  );
}

export default App;
