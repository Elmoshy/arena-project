/**
 * Game-agnostic core types.
 *
 * Nothing in this file knows the rules of Tic Tac Toe, Chess, or any other
 * game. It only describes the *shape* every turn-based game must conform to
 * so the room/runtime layer can stay completely game-agnostic. Concrete
 * games implement `GameEngine<TBoard, TPayload>` in a later phase — this
 * file has no implementations, only contracts.
 */

/** Identifies a game type across the whole system — matches GameConfig.id. */
export type GameId =
  | "tic-tac-toe"
  | "connect-4"
  | "checkers"
  | "chess"
  | "ludo";

export type PlayerId = string;

/**
 * A participant inside a single live game instance.
 * Distinct from `RoomPlayer` (room-scoped, see features/rooms/types.ts)
 * and `Profile` (account-scoped, see features/auth/types.ts) — this is the
 * minimal shape the game engine itself needs to operate.
 */
export interface Player {
  id: PlayerId;
  displayName: string;
  /** Turn-order index: 0 for first to move, 1 for second, etc. */
  seat: number;
  isReady: boolean;
}

export type GameStatus = "not-started" | "in-progress" | "completed" | "abandoned";

/**
 * The full, serializable state of one game instance at a point in time.
 *
 * `TBoard` is intentionally opaque here — each game module defines its own
 * board shape (e.g. a 9-cell array for Tic Tac Toe, an 8x8 matrix for
 * Chess) and narrows `GameState<TBoard>` accordingly. `TMeta` covers
 * per-game extras that don't fit the generic shape (captured pieces, move
 * history, dice rolls, etc.).
 */
export interface GameState<TBoard = unknown, TMeta = Record<string, unknown>> {
  gameId: GameId;
  board: TBoard;
  players: Player[];
  /** PlayerId of whoever moves next. */
  currentTurn: PlayerId;
  status: GameStatus;
  /** PlayerId of the winner, "draw", or null while still in progress. */
  winner: PlayerId | "draw" | null;
  meta: TMeta;
}

/**
 * A single action a player takes. `TPayload` is game-specific — e.g.
 * `{ cell: number }` for Tic Tac Toe, `{ from: Square; to: Square }` for
 * Chess. See features/games/core/actions.ts for the shared lifecycle
 * actions every game also needs (join, ready, forfeit, ...).
 */
export interface GameAction<TPayload = unknown> {
  type: string;
  playerId: PlayerId;
  payload: TPayload;
  timestamp: string;
}

/** Static, data-only configuration describing a game type — used to render lobby/room UI generically, without the engine itself being loaded. */
export interface GameConfig {
  id: GameId;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  isTurnBased: boolean;
}

/**
 * The contract every concrete game module must implement. This is what
 * lets the room/runtime layer call `engine.applyAction(...)` without ever
 * knowing whether it's running Tic Tac Toe or Chess. No game implements
 * this yet — see docs/game-abstraction.md for how this will be used.
 */
export interface GameEngine<TBoard = unknown, TPayload = unknown> {
  config: GameConfig;
  createInitialState: (players: Player[]) => GameState<TBoard>;
  applyAction: (
    state: GameState<TBoard>,
    action: GameAction<TPayload>,
  ) => GameState<TBoard>;
  isValidAction: (
    state: GameState<TBoard>,
    action: GameAction<TPayload>,
  ) => boolean;
  checkWinner: (state: GameState<TBoard>) => PlayerId | "draw" | null;
}
