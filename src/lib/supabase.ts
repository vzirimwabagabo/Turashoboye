// src/lib/supabase.ts
/**
 * Supabase client initialization for Turashoboye Feeds.
 * Uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from the environment.
 * In development the client will be created even if env vars are missing (they
 * can be added later). In production a clear error is thrown to avoid silent
 * configuration issues.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (import.meta.env.PROD) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase environment variables are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
    );
  }
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");
