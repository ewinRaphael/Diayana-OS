import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  import.meta.env?.VITE_SUPABASE_URL ||
  "https://vudbwbqctvbfoqnvidfr.supabase.co";

const supabaseKey =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_ne_-SdBPrplKkBsZTORiDQ__VUevGjz";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
