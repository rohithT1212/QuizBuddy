import React, { useCallback, useEffect, useState } from "react";
import "react-toastify/dist/ReactToastify.css";
import styles from "./SignUp.module.css";
import admin from "./Admin.module.css";
import { ToastContainer } from "react-toastify";
import { supabase } from "../supabaseClient";
import { MODULES_UPDATED } from "../quizApi";
import { notify } from "./toast";
import UploadQuestions from "./UploadQuestions";

const announce = () => window.dispatchEvent(new Event(MODULES_UPDATED));

// Admin page: create, rename and delete modules, and upload questions from Excel.
const Admin = () => {
  const [modules, setModules] = useState([]); // { id, title, description, position, count }
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", description: "" });
  const [editing, setEditing] = useState(null); // { id, title, description }
  const [uploadFor, setUploadFor] = useState(null); // module being uploaded to
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("modules")
      .select("id, title, description, position, questions(count)")
      .order("position");
    if (error) {
      notify("Could not load modules", "error");
    } else {
      setModules(data.map((m) => ({ ...m, count: m.questions?.[0]?.count ?? 0 })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      notify("Enter a module title", "error");
      return;
    }
    setBusy(true);
    const position = modules.length ? Math.max(...modules.map((m) => m.position)) + 1 : 0;
    const { error } = await supabase
      .from("modules")
      .insert({ title, description: form.description.trim() || null, position });
    setBusy(false);
    if (error) return notify(`Could not create module: ${error.message}`, "error");
    setForm({ title: "", description: "" });
    notify("Module created", "success");
    await load();
    announce();
  };

  const saveEdit = async () => {
    const title = editing.title.trim();
    if (!title) return notify("Title can't be empty", "error");
    const { error } = await supabase
      .from("modules")
      .update({ title, description: editing.description.trim() || null })
      .eq("id", editing.id);
    if (error) return notify(`Could not save: ${error.message}`, "error");
    setEditing(null);
    notify("Module updated", "success");
    await load();
    announce();
  };

  const remove = async (m) => {
    const ok = window.confirm(
      `Delete "${m.title}"?\n\nThis permanently deletes its ${m.count} question(s), ` +
        "every user's attempts and scores for it, and all subscriptions. This can't be undone."
    );
    if (!ok) return;
    const { error } = await supabase.from("modules").delete().eq("id", m.id);
    if (error) return notify(`Could not delete: ${error.message}`, "error");
    if (uploadFor?.id === m.id) setUploadFor(null);
    notify("Module deleted", "success");
    await load();
    announce();
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.formLogin} ${styles.testCard}`}>
        <h2>Manage Modules</h2>

        <form className={styles.card} onSubmit={create}>
          <strong>New module</strong>
          <label className={admin.field}>
            Title
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Current Affairs 2025"
              maxLength={120}
            />
          </label>
          <label className={admin.field}>
            Description (optional)
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <button type="submit" className={styles.button} disabled={busy}>
            {busy ? "Creating..." : "Create module"}
          </button>
        </form>

        {loading && <p>Loading...</p>}
        {!loading && modules.length === 0 && <p>No modules yet. Create the first one above.</p>}

        {modules.map((m) => (
          <React.Fragment key={m.id}>
            <div className={styles.card}>
              {editing?.id === m.id ? (
                <>
                  <label className={admin.field}>
                    Title
                    <input
                      type="text"
                      value={editing.title}
                      onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                      maxLength={120}
                    />
                  </label>
                  <label className={admin.field}>
                    Description
                    <textarea
                      rows={2}
                      value={editing.description}
                      onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    />
                  </label>
                  <div className={admin.actions}>
                    <button type="button" onClick={saveEdit}>Save</button>
                    <button type="button" onClick={() => setEditing(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div className={admin.row}>
                    <strong>{m.title}</strong>
                    <span className={admin.meta}>{m.count} question{m.count === 1 ? "" : "s"}</span>
                  </div>
                  {m.description && <p className={admin.hint}>{m.description}</p>}
                  <div className={admin.actions}>
                    <button type="button" onClick={() => setUploadFor(m)}>Upload questions</button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({ id: m.id, title: m.title, description: m.description || "" })
                      }
                    >
                      Rename / edit
                    </button>
                    <button type="button" className={admin.danger} onClick={() => remove(m)}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
            {uploadFor?.id === m.id && (
              <UploadQuestions
                module={m}
                onClose={() => setUploadFor(null)}
                onDone={() => {
                  setUploadFor(null);
                  load();
                  announce();
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      <ToastContainer />
    </div>
  );
};

export default Admin;
