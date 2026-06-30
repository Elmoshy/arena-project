/**
 * Distinct from:
 * - `Profile` (features/auth) — the account-level record.
 * - `RoomPlayer` (features/rooms) — membership inside one room.
 * - `Player` (features/games/core) — a participant inside one live game.
 *
 * `players/` holds the cross-cutting, public-facing shapes used in lists —
 * friend lists, room rosters, future leaderboards — built by joining a
 * Profile with presence/stat data.
 */

/** A lightweight, public-facing player summary used in lists. */
export interface PlayerSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isOnline: boolean;
}

/** Aggregated match history for one player. Populated once games are implemented. */
export interface PlayerStats {
  userId: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
}
