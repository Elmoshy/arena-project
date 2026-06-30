# SQL Setup

Run these in **Supabase Dashboard → SQL Editor**, in numeric order. Each file
is idempotent (`create table if not exists`, `drop ... if exists` before
`create`), so re-running a file after a partial failure is safe.

```
01_profiles.sql                  — profiles table + auto-create trigger on signup
02_rooms.sql                      — rooms table + auto-expiry trigger
03_room_players.sql               — room_players bridge table
04_rls_policies.sql               — Row Level Security for all three tables
05_fix_room_players_recursion.sql — superseded by 04 above; kept for history, see note
06_room_cleanup.sql               — auto-deletes stale waiting/finished rooms (pg_cron + app fallback)
07_room_status_machine.sql        — adds ready_to_start status + auto waiting<->ready_to_start trigger
08_realtime_authorization.sql     — RLS on realtime.messages for presence/broadcast (private channels)
09_realtime_publication.sql       — adds rooms/room_players to supabase_realtime, sets replica identity full
10_host_controls.sql              — RLS policy letting a host delete (kick) another player's row
```

> **Note on 05:** `04_rls_policies.sql` already includes the fix from
> `05_fix_room_players_recursion.sql` — running 04 fresh on a new project
> gets you the corrected policies directly, you don't need to run 05
> afterwards. 05 is kept only because it was applied as a live patch
> during development and is referenced from `PROJECT_LOG.md`; on a
> from-scratch setup, run `01` → `02` → `03` → `04` → `06` → `07` → `08`
> → `09` → `10` and skip `05`.

> **Note on 08/09:** these two are independent of each other and can run
> in either order. `08` covers presence/broadcast (private channels,
> deny-by-default without it); `09` covers Postgres Changes on
> `rooms`/`room_players` (inherits existing RLS automatically, but won't
> fire at all until the tables are in the publication). See
> `docs/testing-realtime.md`'s Troubleshooting section for what each one
> looks like when skipped.

## Why no CLI / migrations tooling

This phase ships raw SQL files instead of Supabase CLI migrations because
the SQL Editor is the most direct path to apply them by hand right now.
Moving to `supabase migration new` / `supabase db push` is a natural next
step once local Supabase CLI tooling is set up — the SQL itself doesn't
need to change, just how it's applied.

## Enabling pg_cron (needed for 06_room_cleanup.sql's scheduled job)

`pg_cron` isn't enabled by default on a new Supabase project. Before
running `06_room_cleanup.sql`:

1. Dashboard → **Database** → **Extensions**
2. Search for `pg_cron`, toggle it on

If you run `06_room_cleanup.sql` before enabling the extension, the
`cron.schedule(...)` calls at the bottom will fail with something like
`schema "cron" does not exist`. The table changes and functions earlier
in that same file will have already applied successfully — it's safe to
enable the extension and re-run the file; `create or replace function`
and the `cron.unschedule` guard make it idempotent.

If you'd rather not enable pg_cron at all, that's fine too: the app-level
fallback in `src/features/rooms/cleanup.ts` calls the same
`cleanup_stale_rooms()` function on page loads (at most once a minute),
so stale rooms still get cleaned up — just only while the site is
actively being used, not on a fixed schedule.

## Verifying after running

In the SQL Editor, a quick sanity check:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public';
```

All three tables (`profiles`, `rooms`, `room_players`) should show
`rowsecurity = true`. If any show `false`, `04_rls_policies.sql` didn't run
(or ran against a session that doesn't see the tables — re-run it last).

## Resetting during development

There's no `down`/rollback script on purpose — these tables don't hold
anything irreplaceable yet. To start over:

```sql
drop table if exists public.room_players cascade;
drop table if exists public.rooms cascade;
drop table if exists public.profiles cascade;
drop function if exists public.handle_new_user cascade;
drop function if exists public.set_room_expiry cascade;
drop function if exists public.set_room_finished_at cascade;
drop function if exists public.cleanup_stale_rooms cascade;
drop function if exists public.recompute_room_ready_status cascade;
drop function if exists public.on_room_players_ready_change cascade;
drop function if exists public.is_room_member cascade;
drop function if exists public.is_room_host cascade;
drop function if exists public.room_player_count cascade;
drop function if exists public.my_room_ids cascade;
drop function if exists public.can_access_room_topic cascade;
select cron.unschedule('cleanup-stale-rooms')
where exists (select 1 from cron.job where jobname = 'cleanup-stale-rooms');
```

Then re-run `01` through `04`, `06` through `10` (skip `05`, per the note
above).
