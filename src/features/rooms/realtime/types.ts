/**
 * Shared types for the realtime abstraction layer in this directory.
 * Kept separate from src/features/rooms/types.ts because these describe
 * the shape of realtime events/state, not the underlying domain model —
 * a PresenceEntry isn't a RoomPlayer, it's "what we know about a
 * connection right now," which can exist without a matching seat (e.g.
 * briefly, between a client opening the page and its first track() call).
 */

/** What each client broadcasts about itself when tracking presence on a room's channel. Kept minimal — anything else about the player (ready state, seat) comes from Postgres Changes on room_players, not presence payloads, since presence is not persisted and shouldn't be treated as a database. */
export interface PresencePayload {
  userId: string;
  displayName: string;
  isHost: boolean;
}

/** One entry in the realtime presence state for a room: a tracked user and the metadata they're broadcasting. A user can have multiple entries if they have the room open in multiple tabs — presenceRefs disambiguates those without deduplicating them away, since "online in 2 tabs" should still resolve to "online", not flicker. */
export interface PresenceEntry extends PresencePayload {
  presenceRefs: string[];
}

/** userId -> PresenceEntry for everyone currently tracked on the room's channel. */
export type RoomPresenceState = Record<string, PresenceEntry>;

export type RoomConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

/** Broadcast (not Postgres-backed) events sent over a room's channel for things that don't need persistence — currently just the kick notification, since by the time a kicked player's client would query the database, their room_players row is already gone and they'd have no way to know *why* they lost access. */
export type RoomBroadcastEvent =
  | { type: "kicked"; userId: string }
  | { type: "session_started" };

export function roomChannelTopic(roomId: string): string {
  return `room:${roomId}`;
}
