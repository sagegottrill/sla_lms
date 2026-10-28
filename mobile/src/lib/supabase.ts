/**
 * Shared Supabase client for the mobile app.
 *
 * Same project, same URL/keys as the web app (envDir points at the repo root),
 * but storage persists in the WebView so sessions survive app restarts.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder_key";

export const isUsingSupabasePlaceholders =
  supabaseUrl === "https://placeholder.supabase.co" || supabaseAnonKey === "placeholder_key";

if (isUsingSupabasePlaceholders) {
  console.warn("Supabase credentials are not set. Using placeholder values.");
}

/** Capacitor Preferences-backed storage — real persistent storage in the shell. */
const capStorage = Capacitor.isNativePlatform()
  ? {
      getItem: async (key: string): Promise<string | null> => {
        const { value } = await Preferences.get({ key });
        return value;
      },
      setItem: async (key: string, value: string): Promise<void> => {
        await Preferences.set({ key, value });
      },
      removeItem: async (key: string): Promise<void> => {
        await Preferences.remove({ key });
      },
    }
  : undefined;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // deep-link callbacks handled by the app shell, not URL
    storage: capStorage ?? (typeof window !== "undefined" ? window.localStorage : undefined),
  },
});
