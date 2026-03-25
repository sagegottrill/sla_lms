import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder_key";

export const isUsingSupabasePlaceholders =
  supabaseUrl === "https://placeholder.supabase.co" || supabaseAnonKey === "placeholder_key";

// Check if credentials are placeholders via console warning for dev environment
if (isUsingSupabasePlaceholders) {
  console.warn("Supabase credentials are not set in .env! Using placeholder values.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});
