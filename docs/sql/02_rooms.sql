-- ============================================================================
-- 02_rooms.sql
-- A room is created by a host, identified by a short invite code, and
-- holds the lobby state before a game starts. `game_id` is nullable in
-- Phase 4: a host names a room and gets an invite code immediately,
-- before anyone has picked what to play. See docs/database-schema.md.
-- ============================================================================

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  code text not null unique,
  host_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'waiting'
    check (status in ('waiting', 'playing', 'finished')),
  -- Matches a GameConfig.id (e.g. "chess") once chosen. Not a foreign key:
  -- the game catalog lives in code (src/features/games/core/types.ts), not
  -- a database table.
  game_id text,
  max_players smallint not null default 2 check (max_players between 2 and 8),
  is_private boolean not null default true,
  invite_expiry_minutes smallint not null default 30 check (invite_expiry_minutes > 0),
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

comment on table public.rooms is
  'Lobby for a match: a host, an invite code, and pre-game settings.';

-- The invite-code alphabet (docs/invite-system.md) excludes 0/O/1/I/L, so
-- this constraint also catches a bad generator before it reaches the
-- player-facing "share this code" UI.
alter table public.rooms
  drop constraint if exists rooms_code_format_check;
alter table public.rooms
  add constraint rooms_code_format_check
  check (code ~ '^[A-HJ-NP-Z2-9]{6}$');

create index if not exists rooms_host_id_idx on public.rooms (host_id);
create index if not exists rooms_code_idx on public.rooms (code);
create index if not exists rooms_status_idx on public.rooms (status);

-- Auto-set expires_at from invite_expiry_minutes whenever a row is
-- inserted or the expiry setting changes, so the app never has to compute
-- this client-side and risk clock drift between client and server.
create or replace function public.set_room_expiry()
returns trigger
language plpgsql
as $$
begin
  new.expires_at := new.created_at + (new.invite_expiry_minutes || ' minutes')::interval;
  return new;
end;
$$;

drop trigger if exists rooms_set_expiry on public.rooms;

create trigger rooms_set_expiry
  before insert on public.rooms
  for each row
  execute function public.set_room_expiry();
