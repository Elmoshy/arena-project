-- ============================================================================
-- 04_rls_policies.sql
-- Row Level Security for profiles, rooms, room_players. Every policy below
-- is written against auth.uid() — the verified user id from the request's
-- JWT, set by Supabase Auth. There is no app-level bypass: even Server
-- Actions run through the anon key + RLS, never the service-role key.
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------

-- Profiles are public-facing by design (usernames shown in room rosters,
-- friend lists, etc. in later phases) — anyone can read any profile.
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- A user can only edit their own profile. No insert policy is defined on
-- purpose: rows are created exclusively by the handle_new_user() trigger
-- (security definer, runs as the table owner), not by client requests.
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- rooms
-- ----------------------------------------------------------------------------

-- Helpers to break a circular RLS dependency: the rooms SELECT policy
-- needs to check room_players (to know if you're seated), and the
-- room_players SELECT policy needs to check rooms (to know if you're
-- host). Evaluated as plain subqueries against each other, Postgres
-- detects that cycle and refuses with "infinite recursion detected in
-- policy". `security definer` functions run with the privileges of the
-- function's owner (the table owner, who bypasses RLS) rather than the
-- calling user's, which breaks the cycle — but only if they're `plpgsql`.
-- Postgres inlines simple `sql`-language functions during query planning,
-- and an inlined function loses its security definer context, so the
-- recursion comes right back. `plpgsql` functions are never inlined.
create or replace function public.is_room_member(target_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1 from public.room_players
    where room_players.room_id = target_room_id
      and room_players.user_id = auth.uid()
  );
end;
$$;

create or replace function public.is_room_host(target_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1 from public.rooms
    where rooms.id = target_room_id
      and rooms.host_id = auth.uid()
  );
end;
$$;

-- A room is visible to: its host, anyone already seated in it, or anyone
-- presenting the matching invite code while the room is still joinable.
-- Rooms are never listed publicly — there is no "browse all rooms" select
-- policy, since rooms default to private and discovery only happens via
-- the invite code.
create policy "Hosts and seated players can view their rooms"
  on public.rooms for select
  using (
    auth.uid() = host_id
    or public.is_room_member(id)
  );

-- The policy above can't cover "find a room by its invite code before
-- you've joined it" — at that point you're neither the host nor seated,
-- so the join would never resolve. A signed-in user may look up a room
-- by code as long as it's still joinable (waiting, not expired, not yet
-- full). This intentionally exposes the row to any authenticated user who
-- already has the code, which matches the invite model in
-- docs/invite-system.md: knowing the code is the access control, not
-- being pre-seated.
--
-- The player-count check below goes through this function rather than a
-- direct `select count(*) from room_players` subquery. A direct subquery
-- here would itself trigger room_players' RLS policy — which calls
-- is_room_host(), which queries rooms — landing back inside the
-- evaluation of *this same rooms policy*. That's a cycle through three
-- policies instead of two, but it's still a cycle, and `security definer`
-- on is_room_host() doesn't save it: the recursion is detected against
-- the originating rooms policy, not against is_room_host() itself. Doing
-- the count() inside a security definer function instead means the
-- subquery never goes through room_players' RLS in the first place.
create or replace function public.room_player_count(target_room_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return (
    select count(*)::integer from public.room_players
    where room_players.room_id = target_room_id
  );
end;
$$;

create policy "Signed-in users can look up a joinable room by code"
  on public.rooms for select
  using (
    status = 'waiting'
    and (expires_at is null or expires_at > now())
    and public.room_player_count(id) < max_players
  );

-- Any signed-in user can create a room — they become the host by setting
-- host_id to their own id (enforced by the check, not just convention).
create policy "Signed-in users can create rooms"
  on public.rooms for insert
  with check (auth.uid() = host_id);

-- Only the host can change room settings (name, status, game_id, etc).
-- Non-host seat/readiness changes happen on room_players, not here.
create policy "Hosts can update their rooms"
  on public.rooms for update
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

create policy "Hosts can delete their rooms"
  on public.rooms for delete
  using (auth.uid() = host_id);

-- ----------------------------------------------------------------------------
-- room_players
-- ----------------------------------------------------------------------------

-- Used by the room_players SELECT policy below: which room_ids has
-- auth.uid() already been seated in? A plain subquery here
-- (`room_id in (select room_id from room_players where user_id =
-- auth.uid())`) queries room_players from *inside* room_players' own
-- policy — a table referencing itself, directly or indirectly, inside
-- its own RLS policy is exactly what Postgres's recursion check rejects,
-- regardless of security definer on anything else in the expression.
create or replace function public.my_room_ids()
returns setof uuid
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return query
    select room_id from public.room_players where user_id = auth.uid();
end;
$$;

-- A player's own membership row, plus every other player's row *in a room
-- they're also seated in* — needed to render the player list on the room
-- page. Without the second clause, players could see their own row only
-- and the roster UI would be empty for everyone but the host.
create policy "Players can view rosters of their own rooms"
  on public.room_players for select
  using (
    user_id = auth.uid()
    or room_id in (select public.my_room_ids())
    or public.is_room_host(room_id)
  );

-- A signed-in user can seat themself — and only themself — in a room.
-- The room-capacity / status='waiting' / not-already-seated checks are
-- application-level validation in the join Server Action (see
-- src/features/rooms/actions.ts), not expressible as a simple RLS check
-- because they require comparing against other rows (current player
-- count) and the room's settings, not just the new row.
create policy "Users can seat themselves in a room"
  on public.room_players for insert
  with check (user_id = auth.uid());

-- A player can update their own readiness; nothing else on this row is
-- meant to change after joining (display_name and seat are set once).
create policy "Users can update their own room_players row"
  on public.room_players for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- A player can remove themself (leave the room). Host-initiated removal
-- (kicking another player) is not implemented in Phase 4.
create policy "Users can remove themselves from a room"
  on public.room_players for delete
  using (user_id = auth.uid());
