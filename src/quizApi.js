import { supabase } from "./supabaseClient";

// Supabase returns at most 1000 rows per request, so every list here is fetched in pages.
const PAGE_SIZE = 1000;

export const fetchModules = async () => {
  const { data, error } = await supabase
    .from("modules")
    .select("id, title, description")
    .order("position");
  if (error) throw error;
  return data;
};

export const fetchAllQuestions = async (moduleId) => {
  const all = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("questions_public")
      .select("id, prompt, option_a, option_b, option_c, option_d")
      .eq("module_id", moduleId)
      .order("position")
      .order("id") // tie-breaker keeps pages stable
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    all.push(...data);
    if (data.length < PAGE_SIZE) return all;
  }
};

// Returns { [moduleId]: { count, bestPct, lastPct } } for the signed-in user (RLS limits rows).
export const fetchAttemptStats = async () => {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("attempts")
      .select("module_id, score, total, created_at")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  const stats = {};
  rows.forEach((a) => {
    const pct = a.total ? Math.round((a.score / a.total) * 100) : 0;
    const s = stats[a.module_id] || { count: 0, bestPct: 0, lastPct: pct }; // rows are newest first
    s.count += 1;
    s.bestPct = Math.max(s.bestPct, pct);
    stats[a.module_id] = s;
  });
  return stats;
};

// Tells the sidebar to refresh its scores (fired after a submit).
export const ATTEMPTS_UPDATED = "quizbuddy:attempts-updated";

// Fired after an admin adds, renames or deletes modules so lists elsewhere refresh.
export const MODULES_UPDATED = "quizbuddy:modules-updated";

// True if the signed-in user is an admin (profiles.is_admin; only settable in the database).
export const fetchIsAdmin = async () => {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return false;
  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (error) return false;
  return !!data?.is_admin;
};

// Fired after subscribing/unsubscribing so the side panel and home page stay in sync.
export const SUBSCRIPTIONS_UPDATED = "quizbuddy:subscriptions-updated";

// Ids of the modules the signed-in user subscribed to (RLS limits rows to their own).
export const fetchSubscribedIds = async () => {
  const { data, error } = await supabase.from("subscriptions").select("module_id");
  if (error) throw error;
  return new Set(data.map((r) => r.module_id));
};

export const subscribeToModule = async (moduleId) => {
  // user_id defaults to the signed-in user in the database.
  const { error } = await supabase.from("subscriptions").insert({ module_id: moduleId });
  if (error && error.code !== "23505") throw error; // 23505 = already subscribed
  window.dispatchEvent(new Event(SUBSCRIPTIONS_UPDATED));
};

export const unsubscribeFromModule = async (moduleId) => {
  const { error } = await supabase.from("subscriptions").delete().eq("module_id", moduleId);
  if (error) throw error;
  window.dispatchEvent(new Event(SUBSCRIPTIONS_UPDATED));
};
