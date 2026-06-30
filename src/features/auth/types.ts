/**
 * `User` mirrors the account record Supabase Auth will manage. `Profile`
 * is the public, app-owned record (one-to-one with `User`) that the rest
 * of the app actually joins against — see docs/database-schema.md.
 */
export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}
