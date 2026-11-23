import React, { useState } from "react";
import styles from "./SignUp.module.css";
import admin from "./Admin.module.css";
import { supabase } from "../supabaseClient";
import { readWorkbook } from "../excelImport";
import { notify } from "./toast";

const MAX_BYTES = 10 * 1024 * 1024;

// Upload an Excel/CSV file, preview what will be imported, then add it to one module.
const UploadQuestions = ({ module, onClose, onDone }) => {
  const [sheets, setSheets] = useState(null); // [{ name, valid, skipped }]
  const [sheetIndex, setSheetIndex] = useState(0);
  const [replace, setReplace] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      notify("File is larger than 10 MB", "error");
      return;
    }
    setParsing(true);
    try {
      const parsed = await readWorkbook(file);
      setSheets(parsed);
      const firstUseful = parsed.findIndex((s) => s.valid.length > 0);
      setSheetIndex(firstUseful >= 0 ? firstUseful : 0);
    } catch (err) {
      notify("Could not read that file. Use .xlsx, .xls or .csv.", "error");
      setSheets(null);
    }
    setParsing(false);
  };

  const sheet = sheets ? sheets[sheetIndex] : null;

  const doImport = async () => {
    if (!sheet || sheet.valid.length === 0) return;
    if (
      replace &&
      !window.confirm(
        `Replace all ${module.count} existing question(s) in "${module.title}"? ` +
          "Users' saved answers for those questions will be deleted."
      )
    ) {
      return;
    }
    setImporting(true);
    const { data, error } = await supabase.rpc("admin_add_questions", {
      p_module_id: module.id,
      p_rows: sheet.valid,
      p_replace: replace,
    });
    setImporting(false);
    if (error) {
      notify(`Import failed: ${error.message}`, "error");
      return;
    }
    notify(`Imported ${data} question(s) into ${module.title}`, "success");
    onDone();
  };

  return (
    <div className={`${styles.card} ${admin.panel}`}>
      <div className={admin.row}>
        <strong>Upload questions to “{module.title}”</strong>
        <button type="button" className={styles.linkBtn} onClick={onClose}>
          Close
        </button>
      </div>
      <p className={admin.hint}>
        Excel (.xlsx/.xls) or .csv. Columns: A question, B–E options A–D, F correct letter
        (A–D). A header row is skipped.
      </p>
      <input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} disabled={parsing || importing} />
      {parsing && <p>Reading file...</p>}

      {sheets && (
        <>
          {sheets.length > 1 && (
            <label className={admin.field}>
              Sheet
              <select value={sheetIndex} onChange={(e) => setSheetIndex(Number(e.target.value))}>
                {sheets.map((s, i) => (
                  <option key={s.name} value={i}>
                    {s.name} ({s.valid.length} valid)
                  </option>
                ))}
              </select>
            </label>
          )}

          <p>
            <strong>{sheet.valid.length}</strong> question(s) ready to import
            {sheet.skipped.length > 0 && (
              <>
                , <strong>{sheet.skipped.length}</strong> row(s) skipped
              </>
            )}
            .
          </p>

          {sheet.valid.slice(0, 3).map((q, i) => (
            <div key={i} className={admin.preview}>
              <div>{q.prompt}</div>
              <small>
                A) {q.option_a} · B) {q.option_b} · C) {q.option_c} · D) {q.option_d} —{" "}
                <b>answer {q.correct}</b>
              </small>
            </div>
          ))}

          {sheet.skipped.length > 0 && (
            <details>
              <summary>Skipped rows</summary>
              <ul className={admin.skipList}>
                {sheet.skipped.slice(0, 50).map((s) => (
                  <li key={s.row}>
                    Row {s.row}: {s.reason}
                  </li>
                ))}
                {sheet.skipped.length > 50 && <li>…and {sheet.skipped.length - 50} more</li>}
              </ul>
            </details>
          )}

          <label className={admin.check}>
            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
            Replace the {module.count} existing question(s) instead of adding to them
          </label>

          <button
            type="button"
            className={styles.button}
            onClick={doImport}
            disabled={importing || sheet.valid.length === 0}
          >
            {importing ? "Importing..." : `Import ${sheet.valid.length} question(s)`}
          </button>
        </>
      )}
    </div>
  );
};

export default UploadQuestions;
