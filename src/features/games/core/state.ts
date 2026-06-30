/**
 * Generic state-container contracts for the future runtime layer.
 *
 * `GameState` (core/types.ts) is the pure, game-rules state. `GameSession`
 * wraps it with the metadata a store/UI layer needs but the game engine
 * itself doesn't care about — history for replay, timestamps, room
 * linkage. The function types below are signatures a future store
 * (Zustand, or a Supabase Realtime reducer, see docs/realtime-architecture.md)
 * will implement. Nothing here is implemented yet.
 */
import type { GameState, PlayerId } from "./types";
import type { AnyAction } from "./actions";

export interface GameSession<TBoard = unknown> {
  id: string;
  roomId: string;
  state: GameState<TBoard>;
  /** Ordered log of every action applied — enables replay and late-joining spectators. */
  history: AnyAction[];
  createdAt: string;
  updatedAt: string;
}

/** Signature a future store will implement to advance a session by one action. */
export type SessionReducer<TBoard = unknown> = (
  session: GameSession<TBoard>,
  action: AnyAction,
) => GameSession<TBoard>;

/** Read-only selectors a future UI layer will use against a session. */
export interface SessionSelectors<TBoard = unknown> {
  getCurrentPlayer: (session: GameSession<TBoard>) => PlayerId;
  isPlayersTurn: (session: GameSession<TBoard>, playerId: PlayerId) => boolean;
  isFinished: (session: GameSession<TBoard>) => boolean;
}
