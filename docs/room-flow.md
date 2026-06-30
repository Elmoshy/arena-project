# Room Flow

> **Implementation status (Phase 5):** All five steps below are now
> implemented through "Game Starts" — see `src/features/rooms/actions.ts`,
> `queries.ts`, `realtime/`, and the components under
> `src/components/rooms/`. "After the game ends" is still design-only:
> nothing currently moves a room to `finished`, since that depends on
> gameplay (Phase 6+) actually existing.

The documented flow:

```
Player
  ↓
Create Room
  ↓
Generate Invite Code
  ↓
Friend Joins
  ↓
Ready State
  ↓
Game Starts
```

Expanded, with the types and state changes involved at each step.

---

## 1. Create Room

A signed-in player picks a name and creates a room from `/rooms/create` —
no game is chosen at this point. (Earlier phases assumed room creation
happened from inside a game's page with the game preselected; Phase 4
decouples the two so a host can set up a room and invite friends before
anyone has decided what to play.)

- A `Room` row is created with `status: "waiting"`, `host_id` set to the
  creator, `name` set to what the host typed, and `gameId: null`.
  `maxPlayers` defaults to 2 until a game is picked and clamps the room's
  capacity (see `docs/sql/02_rooms.sql`).
- A matching `RoomPlayer` row is created for the host with `seat: 0`,
  `isHost: true`, `isReady: false`.

## 2. Generate Invite Code

- A short, human-shareable `code` (e.g. `"ABCD12"`) is generated and stored
  on the `Room` row. Generation strategy, uniqueness, and expiry are
  detailed in `docs/invite-system.md`.
- `expiresAt` is set based on `RoomSettings.inviteExpiryMinutes`.

## 3. Friend Joins

- A second (or third, fourth — depending on `settings.maxPlayers`) player
  opens `/rooms/join` and enters the code manually.
- Validation before a join is accepted:
  - Room exists and `status === "waiting"` (enforced by RLS — see the
    "joinable room by code" policy in `docs/sql/04_rls_policies.sql`,
    which hides anything not in that state from this lookup entirely).
  - Invite code has not expired.
  - `room.players.length < settings.maxPlayers`.
  - The joining player isn't already seated in this room — if they are,
    they're redirected straight to the room instead of erroring.
- On success, a new `RoomPlayer` row is created with the next free `seat`
  index, `isHost: false`, `isReady: false`. Two players joining at nearly
  the same instant can race for the same seat number; the database's
  `room_players_unique_seat` constraint catches that, and the join action
  recovers by re-reading the roster and retrying once with the
  now-current seat count (see `joinRoomAction` in
  `src/features/rooms/actions.ts`).

## 4. Ready State

- Each seated player (host included) flips their own `RoomPlayer.isReady`
  via the "I'm Ready" button (`toggleReadyAction` in
  `src/features/rooms/actions.ts`). This only ever touches the caller's
  own row — there's no "ready up the whole room" shortcut.
- A database trigger (`recompute_room_ready_status`, see
  `docs/sql/07_room_status_machine.sql`) recomputes after every
  join/leave/ready-toggle: once at least `RoomSettings.minReadyPlayers`
  seated players are ready, `Room.status` flips automatically from
  `"waiting"` to `"ready_to_start"` — no client, host or otherwise,
  decides this. If a player un-readies and drops the count back below
  the threshold, the same trigger flips it back to `"waiting"`.
- This is a deliberate three-state split (`waiting` /
  `ready_to_start` / `playing`) rather than the original two-state design
  implied by the diagram above: the room *can* start once enough players
  are ready, but doesn't until the host says so in step 5 — separating
  "is allowed to start" (computed) from "did start" (a host decision)
  keeps a slow-typing or AFK player's late ready-up from yanking the room
  into a game nobody asked to start yet.

## 5. Game Starts

- Only reachable once `Room.status === "ready_to_start"` — the host's
  "Start Session" button (`startSessionAction`) is disabled otherwise,
  and the action itself only succeeds against a room in that exact
  state (`.eq("status", "ready_to_start")` in the update), so a stale
  click after someone un-readies is a no-op rather than a forced start.
- Today, "starting" only flips `Room.status` to `"playing"` — see
  `src/features/games/session/` for the structures a future phase will
  use to actually create a `Game` row and initial `GameState` at this
  point. The paragraph below describes that *intended* next step, not
  something currently wired up:
  - A `Game` row would be created (`status: "not-started"` →
    `"in-progress"`), linked via `room_id`, with `state` initialized by
    the chosen game's `GameEngine.createInitialState(players)`.
  - `Room.gameId` would be set to the new `Game.id`.
  - Play would proceed through `GameAction`s described in
    `src/features/games/core/actions.ts` and synchronized per
    `docs/realtime-architecture.md`.

## After the game ends

- `Game.status` becomes `"completed"` (or `"abandoned"` on forfeit/disconnect
  timeout) and `Room.status` becomes `"finished"`.
- The host can trigger a rematch: a new `Game` row is created against the
  same `Room` (same players, fresh `state`), and `Room.status` returns to
  `"waiting"` then `"playing"` again — this is why `games.room_id` is a
  one-to-many relationship rather than 1:1.

---

## Edge cases to design for later (not solved yet)

- **Host leaves before the game starts** — host role needs to transfer to
  another seated player, or the room needs to close.
- **A player disconnects mid-game** — covered conceptually by
  `ForfeitActionPayload.reason: "disconnect"` in
  `src/features/games/core/actions.ts`, but the actual timeout/grace-period
  policy isn't designed yet.
- **Room never fills up** — invite expiry (see `docs/invite-system.md`)
  is the mechanism that eventually closes a stale waiting room.
- **Player tries to join a full or already-playing room** — rejected at
  validation time in step 3; the exact UI/error messaging isn't designed
  yet.
- **Room created but host-seating insert fails** — `createRoomAction`
  inserts the `rooms` row and the host's `room_players` row as two
  separate statements (not a transaction, since the Supabase client used
  here doesn't expose multi-statement transactions). If the second insert
  fails, the room exists with no players in it. Not handled yet — would
  need either a Postgres function wrapping both inserts atomically, or a
  cleanup job for rooms with zero players.
- **Host kicks a player while that player is mid-toggle-ready** —
  `kickPlayerAction` deletes the row outright; a concurrent
  `toggleReadyAction` from the kicked player would simply find no row to
  update and fail quietly. Not a data-integrity problem (there's nothing
  left to corrupt), just a slightly confusing error message for someone
  who got kicked at an unlucky moment.
- **Presence says "offline" for someone who's actually mid-reconnect** —
  presence reflects the Realtime *connection*, not the player's
  intent; a brief network blip shows as offline for the few seconds it
  takes the client to reconnect and re-track. See
  `docs/testing-realtime.md` for how to observe this directly.
- **Host closes their last tab without a graceful disconnect** — presence
  resolves this correctly via Phoenix's heartbeat timeout (the host shows
  offline once the server stops hearing from them), but nothing currently
  transfers host privileges or otherwise reacts to "the host is gone" —
  the room just sits in whatever state it was in, with an offline host,
  until cleanup_stale_rooms() eventually removes it if it's still
  `"waiting"`.
