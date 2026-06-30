/**
 * Structures only — no gameplay logic lives here. This is the seam
 * between a `Room` (lobby/presence concerns, features/rooms/) and a
 * `GameEngine` (rules concerns, features/games/core/) that a future
 * phase will wire together: once a host starts a session
 * (startSessionAction moves rooms.status to "playing"), *something* needs
 * to create a GameState from the room's seated players and persist it —
 * that something is RoomGameSession, not yet implemented (see session.ts).
 *
 * Named `RoomGameSession` rather than `GameSession` to avoid colliding
 * with the unrelated `GameSession` already defined in
 * features/games/core/state.ts (a history/replay-oriented container
 * around `GameState`, designed in an earlier phase). The two describe
 * different things — that one wraps pure game state for replay, this one
 * tracks the room-to-game lifecycle — and are expected to compose later
 * (a RoomGameSession will likely hold a core `GameSession` once `state`
 * below is implemented) rather than merge into one type.
 *
 * Phase 5 explicitly stops short of building any of that; this file
 * exists so the shape is settled before the logic is, the same way
 * GameEngine in core/types.ts was settled before any concrete game
 * implemented it.
 */
import type { GameId, GameState, Player } from "../core/types";

export type SessionStatus = "pending" | "active" | "completed" | "abandoned";

/**
 * Runtime pairing of a room and the game instance running inside it.
 * Deliberately does not embed a `Room` — a session needs a roomId to
 * know where it lives, not the full room object, which would create a
 * circular type dependency between features/rooms and features/games and
 * go stale the moment the room's roster changes without the session
 * itself changing.
 */
export interface RoomGameSession<TBoard = unknown> {
  id: string;
  roomId: string;
  gameId: GameId;
  status: SessionStatus;
  /** Null until the session actually starts — see createSession() in session.ts for why this stays unimplemented for now. */
  state: GameState<TBoard> | null;
  players: Player[];
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
}

/** Minimal shape a caller needs to provide to start a session — deliberately narrower than `Room`, for the same reason RoomGameSession doesn't embed one. */
export interface SessionStartInput {
  roomId: string;
  gameId: GameId;
  players: Player[];
}
