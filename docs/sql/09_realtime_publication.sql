-- ============================================================================
-- 09_realtime_publication.sql
-- Adds rooms and room_players to the supabase_realtime publication —
-- required for Postgres Changes (subscribeRoom.ts / subscribePlayers.ts)
-- to fire at all. Without this, .on("postgres_changes", ...) subscribes
-- successfully but simply never receives any event; there's no error to
-- surface, which makes this an easy step to silently skip.
--
-- REPLICA IDENTITY FULL is set so UPDATE events include the full previous
-- row in `old` (useful for diffing what changed — e.g. "did is_ready just
-- flip?"). Note this does NOT extend to DELETE: with RLS enabled, a
-- DELETE's `old` payload is restricted to the primary key regardless of
-- replica identity, since Realtime can't re-check policy on a row that no
-- longer exists. See docs/sql/README.md for more on this distinction.
-- ============================================================================

alter table public.rooms replica identity full;
alter table public.room_players replica identity full;

-- `add table` fails if the table is already in the publication, so guard
-- with a check against pg_publication_tables rather than running the
-- alter unconditionally (idempotency, like every other file in this
-- directory).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'room_players'
  ) then
    alter publication supabase_realtime add table public.room_players;
  end if;
end;
$$;
