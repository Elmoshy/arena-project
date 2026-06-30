-- ============================================================================
-- 08_realtime_authorization.sql
-- Authorizes private Realtime channels for room presence. Without this,
-- a private channel rejects every connection (the default with no
-- policies is deny-all), and a public channel would let anyone who
-- guesses or intercepts a room's UUID see who's online in it — private
-- channels checked against room membership are what's actually used here.
--
-- Topic naming convention: every room's channel topic is `room:{room.id}`
-- (see src/features/rooms/realtime/presence.ts). These policies parse
-- that prefix back out with `realtime.topic()` to find the room id, then
-- check the same membership rule used everywhere else in this app: the
-- requesting user must be the host or a seated player in that room.
--
-- This only covers Presence (who's online) and Broadcast (used for the
-- "kicked" notification — see startSessionAction/kickPlayerAction). Roster
-- and ready-status changes go through Postgres Changes instead, which
-- already inherits the RLS policies on room_players from
-- docs/sql/04_rls_policies.sql — no separate authorization needed for
-- those events.
-- ============================================================================

alter table realtime.messages enable row level security;

-- Shared check: does auth.uid() belong to the room encoded in the current
-- topic? `security definer` because this needs to read room_players
-- regardless of which RLS policies would normally apply to the caller —
-- there's no recursion risk here since realtime.messages isn't one of the
-- tables room_players' own policies reference.
create or replace function public.can_access_room_topic()
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  target_room_id uuid;
begin
  -- Topics are formatted "room:<uuid>" by subscribeRoom() — anything not
  -- matching that shape (a stray channel, a typo, a probe) is rejected
  -- rather than erroring, since a malformed topic should just mean "no
  -- access" instead of a 500 from a failed uuid cast.
  if (select realtime.topic()) !~ '^room:[0-9a-fA-F-]{36}$' then
    return false;
  end if;

  target_room_id := substring((select realtime.topic()) from 6)::uuid;

  return exists (
    select 1 from public.rooms
    where rooms.id = target_room_id and rooms.host_id = auth.uid()
  ) or exists (
    select 1 from public.room_players
    where room_players.room_id = target_room_id
      and room_players.user_id = auth.uid()
  );
end;
$$;

drop policy if exists "Room members can read presence and broadcast" on realtime.messages;

create policy "Room members can read presence and broadcast"
  on realtime.messages for select
  to authenticated
  using (
    extension in ('presence', 'broadcast')
    and public.can_access_room_topic()
  );

drop policy if exists "Room members can send presence and broadcast" on realtime.messages;

create policy "Room members can send presence and broadcast"
  on realtime.messages for insert
  to authenticated
  with check (
    extension in ('presence', 'broadcast')
    and public.can_access_room_topic()
  );
