// src/lib/supabase.ts
/**
 * Supabase client initialization for Turashoboye Feeds.
 * Strictly sources configuration from environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
 * Embedded credentials and fallback API tokens have been removed for security compliance.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined) ||
  "";

const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
  "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Security Warning] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not defined in the environment. " +
    "Database operations will fail until valid environment variables are supplied."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://unconfigured.supabase.co",
  supabaseAnonKey || "unconfigured-anon-key"
);
