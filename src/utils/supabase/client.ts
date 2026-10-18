// src/utils/supabase/client.ts
/**
 * Browser Supabase client helper.
 * Strictly sources configuration from environment variables.
 */
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined) ||
  "";

const supabaseKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
  "";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl || "https://unconfigured.supabase.co",
    supabaseKey || "unconfigured-key"
  );
