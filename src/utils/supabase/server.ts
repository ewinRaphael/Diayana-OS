import { createServerClient, type CookieOptions } from "@supabase/ssr";

const supabaseUrl =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  "https://vudbwbqctvbfoqnvidfr.supabase.co";

const supabaseKey =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  "sb_publishable_ne_-SdBPrplKkBsZTORiDQ__VUevGjz";

interface CookieStoreLike {
  getAll(): { name: string; value: string }[];
  set(name: string, value: string, options?: CookieOptions): void;
}

export const createClient = (cookieStore: CookieStoreLike) => {
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored in Server Component rendering
          }
        },
      },
    },
  );
};
