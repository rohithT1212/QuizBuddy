import React, { useState, useEffect,useRef } from "react";
import "react-toastify/dist/ReactToastify.css";
import styles from "./SignUp.module.css";
import { ToastContainer, toast } from "react-toastify";
import { GoogleSpreadsheet } from "google-spreadsheet";
import Test from "./Test";
import { Link,useNavigate } from "react-router-dom";



const Modules = () => {
  const SPREADSHEET_ID = process.env.REACT_APP_QBANK_SHEET_ID; // extracted from the URL
  const CLIENT_EMAIL = process.env.REACT_APP_CLIENT_EMAIL;
  const PRIVATE_KEY = process.env.REACT_APP_PRIVATE_KEY.replace(/\\n/g, '\n');
  const navigate = useNavigate();


  const [data, setData] = useState({
    email: "",
    password: "",
  });

  const [touched, setTouched] = useState({});
  const [testModules, setTestModules] = useState([]);
  const [sheetData, setSheetData] = useState([]);
  const [selectedSheetName, setSelectedSheetName] = useState('');
  const docRef = useRef(null);

  useEffect(() => {
        // call api or anything
        fetchSheets();
        console.log("loaded");
     },[]);

  const fetchSheets = async () => {
    try {
      debugger;
      const doc =  await authenticateAndLoadDoc();
      const sheets = Object.values(doc.sheetsById).map(sheet => ({
      Name: sheet.title,
      Id: sheet.index,
    }));
      setTestModules(sheets);

      console.log(testModules1);

    } catch (e) {
      console.error('Error: ', e);
    }  
  };

  const authenticateAndLoadDoc = async () => {
    if (!docRef.current) {
      const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
      try{
        await doc.useServiceAccountAuth({
        client_email: CLIENT_EMAIL,
        private_key: PRIVATE_KEY
      });
      await doc.loadInfo();
      docRef.current = doc;
      }
      catch(e){
        console.error('Error: ', e);
      }
    }
    return docRef.current;
  };

  const fetchSheetRows = async(moduleId,moduleName) => {
    try {
      debugger;
      const doc =  await authenticateAndLoadDoc();
      const sheet = doc.sheetsByIndex[moduleId];

      const rows = await sheet.getRows();
      const data = rows.map((row,index) => ({
      row: row._rawData,
      id: index,
    }));
      debugger;
      console.log(data);
      setSheetData(data);
      setSelectedSheetName(moduleName);
      navigate("/test",{ state: {
            sheetName: moduleName,
            data: data,
      }});

    } catch (e) {
      console.error('Error: ', e);
    }  
  }

  const testModules1 = [
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
            <div key={module.Id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
                <h2 className="text-xl font-semibold">{module.Name}</h2>
                <button type="button" onClick ={() => fetchSheetRows(module.Id,module.Name)} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Start Test
                </button>
                <br /> <br />      
            </div>
        ))}
        </div>

      </form>
      <ToastContainer />

    </div>
    
    );
};

export default Modules;
