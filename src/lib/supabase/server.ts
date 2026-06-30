/**
 * Supabase client for Server Components, Server Actions, and Route
 * Handlers. Create a new instance per request — never module-scope this,
 * since it's bound to the current request's cookies.
 *
 * `setAll` is wrapped in try/catch because Server Components can call
 * `cookies().set()` (indirectly, via Supabase trying to refresh the
 * session) but Next.js forbids writing cookies outside of Server Actions
 * and Route Handlers. When that happens here, the write is a no-op for
 * this render; the session refresh still gets persisted because `proxy.ts`
 * runs `getUser()` on every navigation and rewrites the cookies there.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component — see file comment above.
          }
        },
      },
    },
  );
}
