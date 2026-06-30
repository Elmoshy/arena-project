# Database Schema

Target database is Supabase (Postgres). Columns use `snake_case` (Postgres
convention); the TypeScript types in `src/features/*/types.ts` use
`camelCase` and are mapped at the data-access layer in
`src/lib/supabase/mappers.ts`.

All tables use `uuid` primary keys (`default gen_random_uuid()`) unless
noted otherwise.

> **Implementation status:** `profiles`, `rooms`, and `room_players`
> below are implemented — see the runnable SQL in `docs/sql/`, which is
> the source of truth for exact column types, defaults, and constraints.
> `games` and `friendships` are still design-only, carried over unchanged
> from earlier phases for when gameplay and the friends system are built.
> As of Phase 5, `rooms` and `room_players` are also registered with
> Supabase Realtime (`docs/sql/09_realtime_publication.sql`) and `rooms`
> has an additional automatic status transition — see the `rooms` section
> below and `docs/sql/07_room_status_machine.sql`.

---

## `profiles`

One row per registered user. `id` is shared with Supabase Auth's
`auth.users.id` — there is no separate `user_id` column because the
relationship is 1:1 and `id` doubles as the foreign key.

| Column        | Type          | Constraints                          |
|---------------|---------------|---------------------------------------|
| `id`          | `uuid`        | PK, references `auth.users.id`        |
| `username`    | `text`        | not null, unique                      |
| `display_name`| `text`        | not null                              |
| `avatar_url`  | `text`        | nullable                              |
| `created_at`  | `timestamptz` | not null, default `now()`             |

**Relationships**
- `profiles.id` → `auth.users.id` (1:1, Supabase-managed).
- Referenced by: `rooms.host_id`, `room_players.user_id`, `games.winner_id`,
  `friendships.requester_id`, `friendships.addressee_id`.

Maps to `Profile` in `src/features/auth/types.ts`.

---

## `rooms`

A room is created by a host, identified by a short invite `code`, and
holds the lobby state before a game starts. As of Phase 4, a room is named
and gets its invite code at creation time, before any game is picked —
`game_id` stays null until one is chosen. As of Phase 5, `status` includes
an automatic `ready_to_start` step computed from how many seated players
are ready, and a room tracks when it finished (for the cleanup window in
`docs/sql/06_room_cleanup.sql`).

| Column                  | Type          | Constraints                                          |
|-------------------------|---------------|--------------------------------------------------------|
| `id`                    | `uuid`        | PK                                                      |
| `name`                  | `text`        | not null — host-chosen label, e.g. "Friday Night Chess" |
| `code`                  | `text`        | not null, unique — see `docs/invite-system.md`          |
| `host_id`               | `uuid`        | not null, FK → `profiles.id`                            |
| `status`                | `text`        | not null, enum: `waiting` \| `ready_to_start` \| `playing` \| `finished`, default `waiting` |
| `game_id`               | `text`        | nullable — matches a `GameConfig.id` (e.g. `"chess"`) once chosen; not a FK since the game catalog is defined in code, not a table |
| `max_players`           | `smallint`    | not null, default `2`                                   |
| `min_ready_players`     | `smallint`    | not null, default `2` — how many seated players must be ready before `recompute_room_ready_status` moves the room to `ready_to_start`; see `docs/sql/07_room_status_machine.sql` |
| `is_private`            | `boolean`     | not null, default `true`                                 |
| `invite_expiry_minutes` | `smallint`    | not null, default `30`                                   |
| `created_at`            | `timestamptz` | not null, default `now()`                               |
| `expires_at`            | `timestamptz` | nullable — auto-computed from `invite_expiry_minutes` by a trigger; see `docs/sql/02_rooms.sql` |
| `finished_at`           | `timestamptz` | nullable — auto-stamped when `status` flips to `finished`; see `docs/sql/06_room_cleanup.sql` |

`isPrivate`, `maxPlayers`, `minReadyPlayers`, `gameId`, and
`inviteExpiryMinutes` are flattened onto individual columns rather than a
single `settings jsonb` column (the original design in earlier phases) —
plain columns let RLS policies and the room-capacity check reference them
directly without unpacking JSON in every query.

The `waiting -> ready_to_start` and `ready_to_start -> waiting` transitions
happen automatically (a trigger on `room_players`, not application code —
see `docs/sql/07_room_status_machine.sql`). `ready_to_start -> playing`
is the one transition a person actually triggers, via the host's "Start
Session" button (`startSessionAction` in `src/features/rooms/actions.ts`).
Nothing currently moves a room to `finished` — that's wired up once
gameplay exists.

**Relationships**
- `rooms.host_id` → `profiles.id` (many rooms : one host).
- `rooms.id` ← `room_players.room_id` (one room : many players).
- `rooms.id` ← `games.room_id` (one room : many games — supports rematches in the same room).

Maps to `Room` in `src/features/rooms/types.ts` (the `players` array on the
TS type is populated by joining `room_players`, not stored on the row; the
flattened columns above are regrouped into `room.settings` by
`mapRoom()` in `src/lib/supabase/mappers.ts`).

---

## `room_players`

Bridge table between `rooms` and `profiles` — one row per seat occupied.

| Column       | Type          | Constraints                                  |
|--------------|---------------|------------------------------------------------|
| `id`         | `uuid`        | PK                                              |
| `room_id`    | `uuid`        | not null, FK → `rooms.id`, on delete cascade    |
| `user_id`    | `uuid`        | not null, FK → `profiles.id`                    |
| `seat`       | `smallint`    | not null — turn-order index                     |
| `is_host`    | `boolean`     | not null, default `false`                       |
| `is_ready`   | `boolean`     | not null, default `false`                       |
| `joined_at`  | `timestamptz` | not null, default `now()`                       |

**Constraints**
- `unique (room_id, user_id)` — a player occupies at most one seat per room.
- `unique (room_id, seat)` — no two players share a seat.

**Relationships**
- `room_players.room_id` → `rooms.id`.
- `room_players.user_id` → `profiles.id`.

Maps to `RoomPlayer` in `src/features/rooms/types.ts`.

---

## Realtime (Phase 5)

`rooms` and `room_players` are both registered with the
`supabase_realtime` publication and set to `replica identity full` (see
`docs/sql/09_realtime_publication.sql`), so Postgres Changes events fire
for them. This is what `src/features/rooms/realtime/subscribeRoom.ts` and
`subscribePlayers.ts` listen to — they inherit the RLS policies on these
tables automatically; no separate authorization is needed for Postgres
Changes itself.

Presence (who's currently online in a room) and the one broadcast event
currently in use (a "kicked" notification) are a different mechanism —
private Realtime channels, authorized by RLS policies on
`realtime.messages` rather than on `rooms`/`room_players`. See
`docs/sql/08_realtime_authorization.sql` and
`docs/testing-realtime.md` for why presence needs its own authorization
layer while roster/status changes don't.

---

## `games`

One row per played (or in-progress) match. A room can produce many games
over time (rematches); a game always belongs to exactly one room.

| Column       | Type          | Constraints                                                      |
|--------------|---------------|---------------------------------------------------------------------|
| `id`         | `uuid`        | PK                                                                    |
| `room_id`    | `uuid`        | not null, FK → `rooms.id`, on delete cascade                         |
| `game_type`  | `text`        | not null — matches `GameConfig.id`                                   |
| `status`     | `text`        | not null, enum: `not-started` \| `in-progress` \| `completed` \| `abandoned`, default `not-started` |
| `state`      | `jsonb`       | not null, default `{}` — serialized `GameState` snapshot             |
| `winner_id`  | `uuid`        | nullable, FK → `profiles.id`                                         |
| `started_at` | `timestamptz` | nullable                                                              |
| `ended_at`   | `timestamptz` | nullable                                                              |
| `created_at` | `timestamptz` | not null, default `now()`                                            |

**Relationships**
- `games.room_id` → `rooms.id`.
- `games.winner_id` → `profiles.id` (nullable — null until the game ends, and stays null on a draw).

Maps to `Game` in `src/features/games/types.ts`.

---

## `friendships`

Self-referential bridge table over `profiles`. A single row represents
one direction of a request; `status` tracks its lifecycle.

| Column          | Type          | Constraints                                  |
|-----------------|---------------|------------------------------------------------|
| `id`            | `uuid`        | PK                                              |
| `requester_id`  | `uuid`        | not null, FK → `profiles.id`                    |
| `addressee_id`  | `uuid`        | not null, FK → `profiles.id`                    |
| `status`        | `text`        | not null, enum: `pending` \| `accepted` \| `declined` \| `blocked`, default `pending` |
| `created_at`    | `timestamptz` | not null, default `now()`                       |
| `responded_at`  | `timestamptz` | nullable                                        |

**Constraints**
- `check (requester_id <> addressee_id)` — no self-friending.
- `unique (requester_id, addressee_id)` — one pending/active request per direction.

**Relationships**
- `friendships.requester_id` → `profiles.id`.
- `friendships.addressee_id` → `profiles.id`.

Maps to `Friendship` in `src/features/friends/types.ts`.

---

## Entity-relationship summary

```
auth.users 1───1 profiles
profiles  1───* rooms            (host_id)
rooms     1───* room_players     (room_id)
profiles  1───* room_players     (user_id)
rooms     1───* games            (room_id)
profiles  1───* games            (winner_id, nullable)
profiles  1───* friendships      (requester_id)
profiles  1───* friendships      (addressee_id)
```

## Not in scope for this phase

- `games` and `friendships`: still design-only, no SQL written yet.
- Row-Level Security for `games` and `friendships` once those tables exist
  (the policies on `profiles`, `rooms`, and `room_players` are implemented
  — see `docs/sql/04_rls_policies.sql`).
- Indexes beyond the unique constraints and the ones already in
  `docs/sql/*.sql`.
