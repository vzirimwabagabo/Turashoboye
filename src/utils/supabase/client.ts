import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined) ||
  "https://snmxdfsijmgukhwtuict.supabase.co";

const supabaseKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  "sb_publishable_-PD9ShZL7d93NOgdmj7QNA_3JfhxK2c";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
