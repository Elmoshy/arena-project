"use client";

/**
 * Subscribes to Postgres Changes on room_players for one room: a player
 * joining, leaving, or toggling ready. This is a *public* channel (no
 * `private: true`) because Postgres Changes authorization comes entirely
 * from the row's own RLS policies (docs/sql/04_rls_policies.sql), not
 * from realtime.messages — a client only receives a change event for a
 * row it could already SELECT directly. See "Interaction with Postgres
 * Changes" in Supabase's Realtime Authorization docs.
 *
 * Deliberately a separate channel from useRoomPresence's — see the
 * comment at the top of presence.ts for why persisted-row changes and
 * ephemeral connection state aren't combined into one subscription.
 */
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mapRoomPlayer } from "@/lib/supabase/mappers";
import type { RoomPlayerRow } from "@/lib/supabase/database.types";
import type { RoomPlayer } from "../types";

interface UseSubscribePlayersOptions {
  roomId: string;
  /** Server-rendered roster at page-load time, used as the starting point before any realtime event has arrived. */
  initialPlayers: RoomPlayer[];
}

export function useSubscribePlayers({
  roomId,
  initialPlayers,
}: UseSubscribePlayersOptions): RoomPlayer[] {
  const [players, setPlayers] = useState<RoomPlayer[]>(initialPlayers);
  // initialPlayers is a fresh array identity on every parent render even
  // when its content hasn't changed (it's derived server-side per
  // request) — re-seeding state from it on every render would wipe out
  // realtime updates the moment any unrelated state in the page changes.
  // Only resync if the room itself changes (a real navigation, not a
  // re-render).
  const seededForRoomId = useRef<string | null>(null);

  useEffect(() => {
    if (seededForRoomId.current !== roomId) {
      seededForRoomId.current = roomId;
      setPlayers(initialPlayers);
    }
    // initialPlayers excluded on purpose — see comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`room-players-changes:${roomId}`)
      .on<RoomPlayerRow>(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` },
        ({ new: row }) => {
          setPlayers((current) => {
            if (current.some((player) => player.id === row.id)) return current;
            return [...current, mapRoomPlayer(row)];
          });
        },
      )
      .on<RoomPlayerRow>(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` },
        ({ new: row }) => {
          setPlayers((current) =>
            current.map((player) => (player.id === row.id ? mapRoomPlayer(row) : player)),
          );
        },
      )
      .on<RoomPlayerRow>(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` },
        // With RLS enabled, Postgres Changes' DELETE payload only ever
        // contains the primary key — even with REPLICA IDENTITY FULL set
        // (see docs/sql/09_realtime_publication.sql) — because Realtime
        // can't re-check a deleted row's RLS policy against every
        // listening client. That's all this needs: `row.id` to filter
        // the player out of local state.
        ({ old: row }) => {
          setPlayers((current) => current.filter((player) => player.id !== row.id));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  return players;
}
