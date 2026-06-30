-- ============================================================================
-- 01_profiles.sql
-- One row per registered user, 1:1 with auth.users. Created automatically
-- by a trigger right after signup — the app never inserts into this table
-- directly. See docs/database-schema.md for the full design rationale.
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Public, app-owned record for each user. 1:1 with auth.users.';

-- Usernames are matched case-insensitively at lookup time, but stored as
-- typed. A separate unique index on the lowercased form prevents
-- "Alice" and "alice" from both existing.
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

-- ----------------------------------------------------------------------------
-- Auto-create a profile when a new auth.users row appears.
--
-- `username` and `display_name` are seeded from the email's local part
-- (everything before "@") plus a short random suffix, since email/password
-- signup alone gives us no display name to work with. The user edits this
-- afterwards from /profile (see docs/sql/04_rls_policies.sql for the update
-- policy that allows it).
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate_username text;
  suffix text;
begin
  base_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'));

  if base_username = '' or base_username is null then
    base_username := 'player';
  end if;

  -- substr(md5(random()...), 1, 5) gives a short, good-enough-for-this
  -- collision-avoidance suffix; the unique index above is the real
  -- guarantee, this just makes a first-try collision unlikely.
  suffix := substr(md5(random()::text || clock_timestamp()::text), 1, 5);
  candidate_username := base_username || '_' || suffix;

  insert into public.profiles (id, username, display_name)
  values (new.id, candidate_username, base_username);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
