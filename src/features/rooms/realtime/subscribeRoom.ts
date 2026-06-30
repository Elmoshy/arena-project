"use client";

/**
 * Subscribes to Postgres Changes on a single room row — status
 * transitions (waiting -> ready_to_start -> playing -> finished), name
 * edits, etc. Separate hook from subscribePlayers.ts because they watch
 * different tables and a page may need one without the other (e.g. a
 * future room-list view would want subscribeRoom-style updates for many
 * rooms at once, but never needs every room's full roster).
 */
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mapRoomFields } from "@/lib/supabase/mappers";
import type { RoomRow } from "@/lib/supabase/database.types";
import type { Room } from "../types";

interface UseSubscribeRoomOptions {
  roomId: string;
  /** Server-rendered room (including its initial player list) at page-load time. */
  initialRoom: Room;
}

/**
 * Returns the room's live status/settings/name, merged with whatever
 * player list is currently known. Player updates are intentionally NOT
 * handled here — pass this hook's output's non-player fields alongside
 * useSubscribePlayers' output rather than trusting this hook's `.players`,
 * since a `rooms` UPDATE payload only carries the room row, not a fresh
 * join against room_players (its `players` array is stale the moment
 * this fires; see RoomDetailClient.tsx for how the two are combined).
 */
export function useSubscribeRoom({
  roomId,
  initialRoom,
}: UseSubscribeRoomOptions): Room {
  const [room, setRoom] = useState<Room>(initialRoom);
  const seededForRoomId = useRef<string | null>(null);

  useEffect(() => {
    if (seededForRoomId.current !== roomId) {
      seededForRoomId.current = roomId;
      setRoom(initialRoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`room-changes:${roomId}`)
      .on<RoomRow>(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        ({ new: row }) => {
          // This payload is the rooms row only — it has no join against
          // room_players, so the previously-known player list is carried
          // forward as-is rather than being recomputed from this event.
          setRoom((current) => ({
            ...mapRoomFields(row),
            players: current.players,
          }));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  return room;
}
