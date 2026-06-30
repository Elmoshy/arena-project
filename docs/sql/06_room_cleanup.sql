-- ============================================================================
-- 06_room_cleanup.sql
-- Auto-deletes two kinds of stale rooms:
--   1. status = 'waiting' rooms that nobody has started a game in within
--      ROOM_WAITING_TIMEOUT of creation.
--   2. status = 'finished' rooms older than ROOM_FINISHED_RETENTION past
--      when they finished, giving players a window to see the result or
--      rematch before the room disappears.
--
-- Note: this is unrelated to `rooms.expires_at`, which tracks invite-code
-- expiry (docs/invite-system.md) — a room can outlive its invite code
-- (still playable by already-seated players) or get cleaned up here while
-- its invite code is technically still "valid". Two different concerns,
-- two different timers.
--
-- finished_at is added here because `rooms` didn't previously track when
-- a game ended — only `created_at` existed, which isn't enough to know
-- how long a finished room has been sitting around.
-- ============================================================================

alter table public.rooms
  add column if not exists finished_at timestamptz;

-- Stamps finished_at the moment status flips to 'finished', so cleanup
-- doesn't have to guess. Re-entering 'finished' (e.g. a future rematch
-- flow that goes finished -> waiting -> finished again) re-stamps it.
create or replace function public.set_room_finished_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'finished' and (old.status is distinct from 'finished') then
    new.finished_at := now();
  elsif new.status <> 'finished' then
    new.finished_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists rooms_set_finished_at on public.rooms;

create trigger rooms_set_finished_at
  before update on public.rooms
  for each row
  execute function public.set_room_finished_at();

-- The cleanup itself. `security definer` because this needs to delete
-- rows regardless of which user (if any) is making the request — a
-- scheduled job has no auth.uid(), and RLS's delete policies are scoped
-- to "the host can delete their own room", not "anyone can delete any
-- stale room". room_players rows cascade-delete via the FK in
-- docs/sql/03_room_players.sql, so deleting from rooms is enough.
create or replace function public.cleanup_stale_rooms()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  room_waiting_timeout interval := interval '5 minutes';
  room_finished_retention interval := interval '5 minutes';
begin
  delete from public.rooms
  where status = 'waiting'
    and created_at < now() - room_waiting_timeout;

  delete from public.rooms
  where status = 'finished'
    and finished_at is not null
    and finished_at < now() - room_finished_retention;
end;
$$;

-- ----------------------------------------------------------------------------
-- Scheduling: pg_cron (primary)
-- ----------------------------------------------------------------------------
-- Runs cleanup_stale_rooms() every minute. Requires the pg_cron extension,
-- which on Supabase is enabled from Dashboard -> Database -> Extensions
-- (search "pg_cron") rather than from SQL — `create extension pg_cron`
-- run here will fail with a permissions error on most Supabase projects,
-- since installing extensions needs a privileged role the SQL Editor's
-- connection doesn't have. If pg_cron isn't enabled yet, the two
-- `select cron...` statements below will error with "schema cron does not
-- exist" — that's fine, the application-level fallback in
-- src/features/rooms/cleanup.ts covers it either way.
select cron.unschedule('cleanup-stale-rooms')
where exists (select 1 from cron.job where jobname = 'cleanup-stale-rooms');

select cron.schedule(
  'cleanup-stale-rooms',
  '* * * * *',
  $$select public.cleanup_stale_rooms();$$
);
