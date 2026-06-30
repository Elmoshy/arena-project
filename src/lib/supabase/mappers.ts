/**
 * Maps `snake_case` database rows (database.types.ts) to the `camelCase`
 * application shapes defined in `src/features/.../types.ts`. Keeping this
 * mapping in one file means a column rename only touches this file plus
 * the SQL, not every Server Action that reads a room or profile.
 */
import type { ProfileRow, RoomRow, RoomPlayerRow } from "./database.types";
import type { Profile } from "@/features/auth/types";
import type { Room, RoomPlayer } from "@/features/rooms/types";
import type { GameId } from "@/features/games/core/types";

export function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    userId: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  };
}

export function mapRoomPlayer(row: RoomPlayerRow): RoomPlayer {
  return {
    id: row.id,
    roomId: row.room_id,
    userId: row.user_id,
    displayName: row.display_name,
    seat: row.seat,
    isHost: row.is_host,
    isReady: row.is_ready,
    joinedAt: row.joined_at,
  };
}

/** Maps every Room field except `players` — used directly by realtime subscribers that receive a bare `rooms` row update with no joined roster, and internally by mapRoom() below. */
export function mapRoomFields(row: RoomRow): Omit<Room, "players"> {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    hostId: row.host_id,
    status: row.status,
    settings: {
      isPrivate: row.is_private,
      maxPlayers: row.max_players,
      minReadyPlayers: row.min_ready_players,
      gameId: row.game_id as GameId | null,
      inviteExpiryMinutes: row.invite_expiry_minutes,
    },
    gameId: row.game_id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

export function mapRoom(row: RoomRow, players: RoomPlayerRow[] = []): Room {
  return {
    ...mapRoomFields(row),
    players: players.map(mapRoomPlayer),
  };
}
