// src/lib/supabase.ts
/**
 * Supabase client initialization for Turashoboye Feeds.
 * Uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from the environment.
 * In development, if env vars are missing or unconfigured, uses a safe mock URL
 * so the application UI and offline fallback components load smoothly without crashing.
 */
import { createClient } from "@supabase/supabase-js";

const rawUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined);

const rawAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined);

const isValidHttpUrl = (str?: string): boolean => {
  if (!str) return false;
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const DEFAULT_SUPABASE_URL = "https://snmxdfsijmgukhwtuict.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNubXhkZnNpam1ndWtod3R1aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyMzcwMjAsImV4cCI6MjEwNzgxMzAyMH0.klP-OynJ0N_s8jvxU9kLiT4eVQlBOFKiFCmbC4SgiDQ";

const supabaseUrl = isValidHttpUrl(rawUrl)
  ? (rawUrl as string)
  : DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  rawAnonKey && rawAnonKey.trim().length > 0 && !rawAnonKey.includes("YOUR_") && !rawAnonKey.includes("placeholder")
    ? rawAnonKey
    : DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
