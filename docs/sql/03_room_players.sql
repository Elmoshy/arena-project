-- ============================================================================
-- 03_room_players.sql
-- Bridge table between rooms and profiles — one row per seat occupied.
-- See docs/database-schema.md.
-- ============================================================================

create table if not exists public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  display_name text not null,
  seat smallint not null check (seat >= 0),
  is_host boolean not null default false,
  is_ready boolean not null default false,
  joined_at timestamptz not null default now(),

  constraint room_players_unique_seat unique (room_id, seat),
  constraint room_players_unique_member unique (room_id, user_id)
);

comment on table public.room_players is
  'One row per player seated in a room. See docs/database-schema.md.';

create index if not exists room_players_room_id_idx on public.room_players (room_id);
create index if not exists room_players_user_id_idx on public.room_players (user_id);

-- Exactly one host per room. Partial unique index rather than a CHECK
-- constraint, since this needs to span multiple rows in the same room.
create unique index if not exists room_players_one_host_per_room
  on public.room_players (room_id)
  where (is_host);
