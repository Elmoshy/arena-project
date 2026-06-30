/**
 * Read-side queries for rooms. Each function assumes the caller already
 * has an authenticated Supabase server client — RLS (see
 * docs/sql/04_rls_policies.sql) is what actually limits the rows returned,
 * not anything in this file.
 */
import { createClient } from "@/lib/supabase/server";
import { mapRoom } from "@/lib/supabase/mappers";
import { runStaleRoomCleanupFallback } from "./cleanup";
import type { Room } from "./types";

/** Every room the current user hosts or is seated in, most recent first. */
export async function getMyRooms(): Promise<Room[]> {
  runStaleRoomCleanupFallback();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("*, room_players(*)")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => mapRoom(row, row.room_players ?? []));
}

/** A single room by id, with its roster — or null if it doesn't exist or RLS hides it from the current user. */
export async function getRoomById(id: string): Promise<Room | null> {
  runStaleRoomCleanupFallback();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("*, room_players(*)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapRoom(data, data.room_players ?? []);
}
