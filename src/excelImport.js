// Reads a question-bank workbook in the browser.
// Columns: A question, B-E options A-D, F correct letter (A-D). A header row is skipped.

const LETTERS = ["A", "B", "C", "D"];

// Parse one sheet's rows ([[cell, ...], ...]) into valid questions and skipped rows.
export const parseRows = (rows) => {
  const valid = [];
  const skipped = [];
  rows.forEach((raw, i) => {
    const r = raw.map((c) => String(c ?? "").trim());
    const [rawPrompt, a, b, c, d, correct] = r;
    const letter = (correct || "").toUpperCase();
    if (i === 0 && !LETTERS.includes(letter)) return; // header row
    // Drop manual numbering such as "Q12. " or "3. ".
    const prompt = (rawPrompt || "").replace(/^\s*Q?\d+[.)]\s+/i, "");
    if (!prompt) return; // blank row
    if (!a || !b || !c || !d) {
      skipped.push({ row: i + 1, reason: "missing an option" });
    } else if (!LETTERS.includes(letter)) {
      skipped.push({ row: i + 1, reason: correct ? `answer "${correct}" is not A-D` : "no correct answer" });
    } else {
      valid.push({ prompt, option_a: a, option_b: b, option_c: c, option_d: d, correct: letter });
    }
  });
  return { valid, skipped };
};

// File -> [{ name, valid, skipped }] for every sheet. xlsx is loaded lazily (admins only).
export const readWorkbook = async (file) => {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  return wb.SheetNames.map((name) => {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], {
      header: 1,
      defval: "",
      blankrows: true,
    });
    return { name, ...parseRows(rows) };
  });
};
