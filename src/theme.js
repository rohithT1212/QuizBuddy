const KEY = "quizbuddy-theme";

// localStorage can throw (private mode, blocked site data), so every access is guarded.
const readStored = () => {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch (e) {
    return null;
  }
};

const systemTheme = () =>
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

export const getTheme = () => readStored() || systemTheme();

export const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#11161c" : "#4ad0cc");
};

export const saveTheme = (theme) => {
  try {
    window.localStorage.setItem(KEY, theme);
  } catch (e) {
    /* ignore: theme still applies for this session */
  }
};

export const initTheme = () => applyTheme(getTheme());
