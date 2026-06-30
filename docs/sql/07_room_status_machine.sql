-- ============================================================================
-- 07_room_status_machine.sql
-- Extends `rooms.status` with `ready_to_start`, between `waiting` and
-- `playing`: waiting -> ready_to_start happens automatically once enough
-- players are ready; ready_to_start -> playing only happens when the host
-- explicitly starts the session (see startSessionAction in
-- src/features/rooms/actions.ts). Going back the other way (a player
-- un-readies) automatically drops ready_to_start back to waiting.
--
-- min_ready_players defaults to max_players (everyone must be ready) but
-- is host-configurable down to 2 — useful for games that support playing
-- with some seats empty/idle.
-- ============================================================================

alter table public.rooms
  drop constraint if exists rooms_status_check;

alter table public.rooms
  add constraint rooms_status_check
  check (status in ('waiting', 'ready_to_start', 'playing', 'finished'));

alter table public.rooms
  add column if not exists min_ready_players smallint;

-- Backfill existing rows (min_ready_players was just added, so every row
-- has it null) before adding the not-null constraint below.
update public.rooms
set min_ready_players = max_players
where min_ready_players is null;

alter table public.rooms
  alter column min_ready_players set default 2;

alter table public.rooms
  drop constraint if exists rooms_min_ready_players_check;

alter table public.rooms
  add constraint rooms_min_ready_players_check
  check (min_ready_players >= 1 and min_ready_players <= max_players);

-- ----------------------------------------------------------------------------
-- Auto-transition waiting <-> ready_to_start
-- ----------------------------------------------------------------------------
-- Recomputes whether a room has enough ready players and flips status
-- accordingly. Only moves between waiting and ready_to_start — never
-- touches a room that's already playing or finished, and never sets
-- ready_to_start unless the room was waiting (so it can't undo a host's
-- in-progress session by accident).
create or replace function public.recompute_room_ready_status(target_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ready_count integer;
  required_count integer;
  current_status text;
begin
  select status, min_ready_players into current_status, required_count
  from public.rooms
  where id = target_room_id;

  if current_status not in ('waiting', 'ready_to_start') then
    return;
  end if;

  select count(*) into ready_count
  from public.room_players
  where room_id = target_room_id and is_ready;

  if ready_count >= required_count and current_status = 'waiting' then
    update public.rooms set status = 'ready_to_start' where id = target_room_id;
  elsif ready_count < required_count and current_status = 'ready_to_start' then
    update public.rooms set status = 'waiting' where id = target_room_id;
  end if;
end;
$$;

-- Fires whenever a room_players row's is_ready changes, or a row is
-- added/removed (joining or leaving changes the ready_count denominator
-- implicitly through required_count too, since min_ready_players is fixed
-- but the pool of players changes).
create or replace function public.on_room_players_ready_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recompute_room_ready_status(old.room_id);
    return old;
  end if;

  perform public.recompute_room_ready_status(new.room_id);
  return new;
end;
$$;

drop trigger if exists room_players_ready_change on public.room_players;

create trigger room_players_ready_change
  after insert or update of is_ready or delete on public.room_players
  for each row
  execute function public.on_room_players_ready_change();
