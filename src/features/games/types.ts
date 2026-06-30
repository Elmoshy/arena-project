import type { GameId, GameStatus } from "./core/types";

/**
 * A persisted game record — one row in the future `games` table
 * (see docs/database-schema.md). This is the durable record of a match;
 * the live, in-memory shape during play is `GameState` in core/types.ts.
 * `state` here holds a serialized `GameState` snapshot.
 */
export interface Game {
  id: string;
  roomId: string;
  gameType: GameId;
  status: GameStatus;
  state: Record<string, unknown>;
  winnerId: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}
