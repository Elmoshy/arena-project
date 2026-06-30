/**
 * Action contracts shared by every game.
 *
 * This file defines the *shapes* of actions that can flow through the
 * engine — lifecycle events common to all games (join, ready, forfeit,
 * restart) plus the generic "move" envelope a concrete game fills with its
 * own payload. There is no reducer here; see core/state.ts for the
 * session/reducer contracts and GameEngine.applyAction in core/types.ts for
 * where the actual rule logic will live.
 */
import type { GameAction } from "./types";

/** Lifecycle action types every game needs, regardless of its rules. */
export const SYSTEM_ACTION_TYPES = {
  JOIN: "system/join",
  LEAVE: "system/leave",
  READY: "system/ready",
  FORFEIT: "system/forfeit",
  RESTART: "system/restart",
} as const;

export type SystemActionType =
  (typeof SYSTEM_ACTION_TYPES)[keyof typeof SYSTEM_ACTION_TYPES];

export interface JoinActionPayload {
  displayName: string;
}

export interface ForfeitActionPayload {
  reason?: "timeout" | "manual" | "disconnect";
}

/** A game-specific move. Concrete games define their own `TPayload`. */
export type MoveAction<TPayload = unknown> = GameAction<TPayload> & {
  type: "move";
};

/** A lifecycle action common to every game, independent of its rules. */
export type SystemAction =
  | (GameAction<JoinActionPayload> & { type: typeof SYSTEM_ACTION_TYPES.JOIN })
  | (GameAction<undefined> & { type: typeof SYSTEM_ACTION_TYPES.LEAVE })
  | (GameAction<undefined> & { type: typeof SYSTEM_ACTION_TYPES.READY })
  | (GameAction<ForfeitActionPayload> & { type: typeof SYSTEM_ACTION_TYPES.FORFEIT })
  | (GameAction<undefined> & { type: typeof SYSTEM_ACTION_TYPES.RESTART });

/** Anything that can flow through the engine: a lifecycle event or a game move. */
export type AnyAction<TMovePayload = unknown> =
  | SystemAction
  | MoveAction<TMovePayload>;

/** Structural check for whether an action is a shared lifecycle action vs. a game-specific move. */
export function isSystemAction(action: GameAction): action is SystemAction {
  return (Object.values(SYSTEM_ACTION_TYPES) as string[]).includes(action.type);
}
