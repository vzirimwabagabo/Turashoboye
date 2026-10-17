// src/lib/supabase.ts
/**
 * Supabase client initialization for Turashoboye Feeds.
 * Uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from the environment.
 * In development, if env vars are missing or unconfigured, uses a safe mock URL
 * so the application UI and offline fallback components load smoothly without crashing.
 */
import { createClient } from "@supabase/supabase-js";

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const isValidHttpUrl = (str?: string): boolean => {
  if (!str) return false;
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const supabaseUrl = isValidHttpUrl(rawUrl)
  ? (rawUrl as string)
  : "https://turashoboye-placeholder.supabase.co";

const supabaseAnonKey =
  rawAnonKey && rawAnonKey.trim().length > 0 && !rawAnonKey.includes("YOUR_")
    ? rawAnonKey
    : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder.anon.key";

if (import.meta.env.DEV && (!rawUrl || !isValidHttpUrl(rawUrl))) {
  console.info(
    "ℹ️ [Turashoboye Feeds] Operating with local mock Supabase endpoint. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file to connect live database."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
