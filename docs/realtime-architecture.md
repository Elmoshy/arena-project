# Realtime Architecture

Documentation only — no realtime connection is wired up yet.

## Two-phase plan

### Phase 1 — Supabase Realtime

Arena's first realtime layer rides on Supabase Realtime, for two reasons:
it's already part of the stack (no new infrastructure), and it gives
"realtime for free" off the `rooms`, `room_players`, and `games` tables via
Postgres change events — no custom server process to run yet.

### Phase 2 — Socket.IO

Once gameplay needs lower, more predictable latency or server-authoritative
move validation (rejecting an illegal chess move before it ever reaches
other clients, rather than after), a dedicated Socket.IO server takes over
the live game-action channel specifically. Room presence/lobby state can
reasonably stay on Supabase Realtime even after this migration — the two
aren't mutually exclusive, and lobby state changes far less often than
in-game moves.

This phase boundary is exactly why `src/features/games/core/actions.ts`
models actions as a flat, serializable `GameAction` shape: that shape is
transport-agnostic, so the Phase 1 → Phase 2 migration changes *how*
actions travel, not *what* they look like.

---

## Room channels

One realtime channel per room, named by room id:

```
room:{roomId}
```

A client subscribes to its room's channel on entering the room/game page
and unsubscribes on leaving. There is no global channel — players never
need updates about rooms they aren't in.

## Events

Two categories of events flow over a room channel:

**Lobby / room-state events** (Phase 1, Supabase Realtime Postgres changes
on `room_players` and `rooms`):

| Event                  | Payload sketch                          | Trigger                          |
|-------------------------|------------------------------------------|------------------------------------|
| `room:player_joined`    | `RoomPlayer`                              | New row in `room_players`          |
| `room:player_left`      | `{ userId: string }`                      | Row deleted from `room_players`    |
| `room:ready_changed`    | `{ userId: string; isReady: boolean }`    | `room_players.is_ready` updated    |
| `room:status_changed`   | `{ status: RoomStatus }`                  | `rooms.status` updated             |

**Game-action events** (Phase 1: Supabase Realtime `broadcast`; Phase 2:
Socket.IO):

| Event                | Payload sketch                                | Trigger                              |
|-----------------------|--------------------------------------------------|-----------------------------------------|
| `game:action_applied` | `GameAction` (see core/actions.ts)               | Any player submits a move or system action |
| `game:state_updated`  | `GameState` (full snapshot, see core/types.ts)   | After an action is validated and applied |
| `game:ended`          | `{ winner: PlayerId \| "draw" }`                 | `checkWinner` returns non-null           |

`game:action_applied` is broadcast optimistically (what was attempted);
`game:state_updated` is the reconciled result (what's actually true) — see
synchronization strategy below for why both exist.

## Synchronization strategy

Recommended approach: **action-log replay**, not last-write-wins on raw
state.

- Every accepted `GameAction` is appended to `GameSession.history` (see
  `core/state.ts`) in order.
- A client that's already in the room applies actions incrementally as
  they arrive (optimistic local update on its own move, reconciled against
  the broadcast `game:state_updated` for others' moves).
- A client that joins late (reconnect, spectator) doesn't need a complex
  catch-up protocol — it just fetches the current `Game.state` snapshot
  (already-reduced state, stored in the `games.state` column) rather than
  replaying the full history itself. The history exists for audit/replay
  features, not as the only source of truth.
- This avoids last-write-wins entirely: because `GameEngine.applyAction` is
  meant to be a pure function of `(state, action) → state`
  (see `core/types.ts`), the *server* (Phase 1: a Postgres function or
  edge function; Phase 2: the Socket.IO server) is the single place that
  actually advances state. Clients only ever send actions and receive
  confirmed state — they never reconcile two conflicting state snapshots
  against each other.

## Not in scope for this phase

- Actual Supabase channel subscription code.
- The Socket.IO server itself.
- Reconnection/backoff policy.
- Spectator mode.
