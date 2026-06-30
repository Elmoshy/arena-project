/**
 * Structures only, per the Phase 5 prompt: "Do not implement gameplay.
 * Only create structures." Every function below throws — there is no
 * partial or stub implementation, because a half-working session
 * lifecycle would be easy to mistake for a real one and build on top of
 * by accident. A future phase replaces these bodies with real logic
 * (likely: look up the GameEngine for `gameId` from a registry not yet
 * built, call its createInitialState/applyAction, persist GameState to
 * the `games` table from docs/database-schema.md) without needing to
 * change this file's exported shape.
 */
import type { GameAction, GameEngine } from "../core/types";
import type { RoomGameSession, SessionStartInput } from "./session-types";

const NOT_IMPLEMENTED =
  "Game sessions are not implemented yet — Phase 5 only defines the structure (see session-types.ts). No game has gameplay built, so there is nothing for this to start, advance, or end.";

/** Will create a RoomGameSession for a room once a host starts it, using the GameEngine registered for `input.gameId`. Not implemented — see file header. */
export function createSession(input: SessionStartInput): RoomGameSession {
  void input;
  throw new Error(NOT_IMPLEMENTED);
}

/** Will run `engine.applyAction` against the session's current state and persist the result. Not implemented — see file header. */
export function applySessionAction<TBoard, TPayload>(
  session: RoomGameSession<TBoard>,
  engine: GameEngine<TBoard, TPayload>,
  action: GameAction<TPayload>,
): RoomGameSession<TBoard> {
  void session;
  void engine;
  void action;
  throw new Error(NOT_IMPLEMENTED);
}

/** Will mark a session completed/abandoned and write the result back to the room (e.g. flipping rooms.status to "finished"). Not implemented — see file header. */
export function endSession(session: RoomGameSession): RoomGameSession {
  void session;
  throw new Error(NOT_IMPLEMENTED);
}
