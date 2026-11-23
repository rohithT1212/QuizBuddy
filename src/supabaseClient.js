import { createClient } from "@supabase/supabase-js";

// The anon key is designed to be public; access is enforced by Row Level Security.
export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);
