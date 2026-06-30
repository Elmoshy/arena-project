import type { GameId } from "@/features/games/core/types";

/**
 * `ready_to_start` is computed automatically (see
 * recompute_room_ready_status in docs/sql/07_room_status_machine.sql)
 * whenever enough players are ready — it's never set directly by the
 * app. Only the host moving `ready_to_start -> playing` (startSessionAction)
 * is a deliberate, user-triggered transition.
 */
export type RoomStatus = "waiting" | "ready_to_start" | "playing" | "finished";

export interface RoomSettings {
  isPrivate: boolean;
  maxPlayers: number;
  /** How many seated players must be ready before the room can move to `ready_to_start`. Defaults to maxPlayers (everyone), host-configurable down to 2. */
  minReadyPlayers: number;
  /**
   * Null until a game is picked for the room. Phase 4 lets a host create a
   * room (with just a name) before choosing what to play, so this can no
   * longer be required at creation time the way Phase 3 assumed.
   */
  gameId: GameId | null;
  /** How long a fresh invite code stays valid, in minutes. See docs/invite-system.md. */
  inviteExpiryMinutes: number;
}

/**
 * A player's membership inside one room. Distinct from `Player` in
 * features/games/core/types.ts (which only exists once a game is live)
 * and from `Profile` in features/auth/types.ts (account-level identity).
 */
export interface RoomPlayer {
  id: string;
  roomId: string;
  userId: string;
  displayName: string;
  /** Turn-order seat, assigned on join. */
  seat: number;
  isHost: boolean;
  isReady: boolean;
  joinedAt: string;
}

export interface Room {
  id: string;
  /**
   * Host-chosen label, e.g. "Friday Night Chess". Added in Phase 4 — rooms
   * are now created by name first, with a game picked later, rather than
   * being implicitly named after the game.
   */
  name: string;
  /** Human-shareable invite code, e.g. "ABCD12". See docs/invite-system.md. */
  code: string;
  hostId: string;
  status: RoomStatus;
  settings: RoomSettings;
  players: RoomPlayer[];
  /** Set once a game has started for this room; null while waiting. */
  gameId: string | null;
  createdAt: string;
  expiresAt: string | null;
}
