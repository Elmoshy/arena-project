/**
 * Server-only helpers for reading the current auth user / profile. Used by
 * every protected Server Component page instead of each one re-deriving
 * this from a raw Supabase client call.
 */
import { createClient } from "@/lib/supabase/server";
import { mapProfile } from "@/lib/supabase/mappers";
import type { Profile } from "./types";

/** The verified current user, or null if signed out. Always hits the Auth server — see @supabase/ssr docs on getUser() vs getSession(). */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

/** The current user's profile row, mapped to the app-facing `Profile` shape. Null if signed out or the profile row hasn't been created yet. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profileRow) return null;
  return mapProfile(profileRow);
}
