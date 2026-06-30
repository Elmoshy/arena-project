-- ============================================================================
-- 05_fix_room_players_recursion.sql
-- Fixes: "infinite recursion detected in policy for relation room_players".
--
-- Cause: rooms.select checks room_players directly, and room_players.select
-- checks rooms directly (for the host_id lookup). Postgres evaluates those
-- into each other and refuses with a recursion error.
--
-- First attempt at this fix wrapped the cross-table checks in `language
-- sql security definer` functions. That still recursed: Postgres inlines
-- simple SQL-language functions during query planning, and once inlined
-- the function's body is spliced directly into the policy's query —
-- losing the security definer context, so RLS applies to the inner query
-- exactly as if no function existed. `plpgsql` functions are never
-- inlined, so they're the only reliable way to keep the security definer
-- context (and therefore the RLS bypass) intact inside a policy.
--
-- Safe to run on a database that already has 01-04 (or a previous version
-- of this file) applied; this only replaces functions and policies, no
-- data is touched.
-- ============================================================================

-- Used by the rooms SELECT policy: is auth.uid() seated in this room?
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

-- Used by the room_players SELECT policy: is auth.uid() the host of this room?
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

drop policy if exists "Hosts and seated players can view their rooms" on public.rooms;

create policy "Hosts and seated players can view their rooms"
  on public.rooms for select
  using (
    auth.uid() = host_id
    or public.is_room_member(id)
  );

drop policy if exists "Players can view rosters of their own rooms" on public.room_players;

create policy "Players can view rosters of their own rooms"
  on public.room_players for select
  using (
    user_id = auth.uid()
    or room_id in (
      select room_id from public.room_players where user_id = auth.uid()
    )
    or public.is_room_host(room_id)
  );
