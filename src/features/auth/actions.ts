"use server";

/**
 * Auth Server Actions: register, login, logout. Each returns a
 * `ActionResult` shape rather than throwing, so client forms can render
 * field-level errors without a try/catch around a redirect (Next.js
 * throws a special redirect error internally — mixing that with
 * arbitrary throw/catch error handling is a common source of bugs).
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Set on actions that don't redirect after success (e.g. profile edits), so the form can show a confirmation instead. */
  success?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): string | null {
  if (!email) return "Email is required.";
  if (!EMAIL_RE.test(email)) return "Enter a valid email address.";
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

export async function registerAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  const emailError = validateEmail(email);
  if (emailError) fieldErrors.email = emailError;
  const passwordError = validatePassword(password);
  if (passwordError) fieldErrors.password = passwordError;
  if (!name) fieldErrors.name = "Name is required.";

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Picked up by handle_new_user() as a fallback only if it ever reads
      // user_metadata directly — current trigger (docs/sql/01_profiles.sql)
      // derives display_name from the email instead, so this is mostly
      // forward-looking metadata for now.
      data: { full_name: name },
    },
  });

  if (error) {
    return { error: mapSupabaseAuthError(error.message) };
  }

  redirect("/dashboard");
}

export async function loginAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "") || "/dashboard";

  const fieldErrors: Record<string, string> = {};
  const emailError = validateEmail(email);
  if (emailError) fieldErrors.email = emailError;
  if (!password) fieldErrors.password = "Password is required.";

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: mapSupabaseAuthError(error.message) };
  }

  // `next` only ever comes from our own proxy.ts redirect (?next=/dashboard)
  // or this form's hidden field — never raw user input rendered as a URL —
  // but it's still constrained to a relative, in-app path defensively.
  const safeNext = next.startsWith("/") ? next : "/dashboard";
  redirect(safeNext);
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function updateProfileAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const username = String(formData.get("username") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (!username) {
    fieldErrors.username = "Username is required.";
  } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    fieldErrors.username =
      "Username must be 3-20 characters: letters, numbers, underscores only.";
  }
  if (!displayName) {
    fieldErrors.displayName = "Display name is required.";
  } else if (displayName.length > 40) {
    fieldErrors.displayName = "Display name must be 40 characters or fewer.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { error: "You need to be signed in to edit your profile." };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ username, display_name: displayName })
    .eq("id", userData.user.id);

  if (updateError) {
    if (updateError.code === "23505") {
      return { fieldErrors: { username: "That username is already taken." } };
    }
    return { error: "Couldn't save your profile. Please try again." };
  }

  return { success: true };
}

/** Turns Supabase's English error strings into messages safe to show as-is. */
function mapSupabaseAuthError(message: string): string {
  if (message.includes("already registered")) {
    return "An account with this email already exists.";
  }
  if (message.includes("Invalid login credentials")) {
    return "Incorrect email or password.";
  }
  if (message.includes("Email not confirmed")) {
    return "Please confirm your email before logging in.";
  }
  return message;
}
