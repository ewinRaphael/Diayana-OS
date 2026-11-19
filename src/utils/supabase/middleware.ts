import { createServerClient, type CookieOptions } from "@supabase/ssr";

const supabaseUrl =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  "https://vudbwbqctvbfoqnvidfr.supabase.co";

const supabaseKey =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  "sb_publishable_ne_-SdBPrplKkBsZTORiDQ__VUevGjz";

interface MinimalRequest {
  cookies: {
    getAll(): { name: string; value: string }[];
    set(name: string, value: string): void;
  };
}

interface MinimalResponse {
  cookies: {
    set(name: string, value: string, options?: CookieOptions): void;
  };
}

export const createClient = (request: MinimalRequest, response: MinimalResponse) => {
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    },
  );
};
