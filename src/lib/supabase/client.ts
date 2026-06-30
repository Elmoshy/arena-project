/**
 * Supabase client for Client Components ("use client" files, browser-side
 * event handlers, effects). Cookie handling is managed internally by
 * `createBrowserClient` — do not pass a custom `cookies` option here.
 *
 * Always create a fresh client via `createClient()` where you need one;
 * `@supabase/ssr` deduplicates the underlying connection itself
 * (`isSingleton` defaults to `true`), so this is cheap to call per-component.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
