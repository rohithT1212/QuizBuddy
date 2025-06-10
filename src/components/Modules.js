import React, { useState, useEffect } from "react";
import "react-toastify/dist/ReactToastify.css";
import styles from "./SignUp.module.css";
import { ToastContainer, toast } from "react-toastify";

const Modules = () => {

  const [data, setData] = useState({
    email: "",
    password: "",
  });

  const [touched, setTouched] = useState({});

  const testModules = [
    { id: 1, name: "Module 1", description: "History" },
    { id: 2, name: "Module 2", description: "Biology" },
    { id: 3, name: "Module 3", description: "Physics" },
    { id: 4, name: "Module 4", description: "Chemistry" },
    { id: 5, name: "Module 5", description: "English" },
];

  return (
    <div className={styles.container}>
      <form
        className={styles.formLogin}
        autoComplete="off"
      >
        <h2>Available Test Modules</h2>
        <div>
            {testModules.map((module) => (
            <div key={module.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
                <h2 className="text-xl font-semibold">{module.name}</h2>
                <p className="text-gray-600">{module.description}</p>
                <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Start Test
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
