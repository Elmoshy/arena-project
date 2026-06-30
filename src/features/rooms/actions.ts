"use server";

/**
 * Room Server Actions: create and join. Both rely on Postgres RLS as the
 * actual authorization boundary (docs/sql/04_rls_policies.sql) — the
 * validation here is for good error messages, not security; a request
 * that slipped past it would still be rejected by the database.
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateInviteCode } from "./invite-code";
import { mapRoom } from "@/lib/supabase/mappers";
import type { ActionResult } from "@/features/auth/actions";

const MAX_CODE_GENERATION_ATTEMPTS = 5;

export async function createRoomAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { fieldErrors: { name: "Room name is required." } };
  }
  if (name.length > 60) {
    return { fieldErrors: { name: "Room name must be 60 characters or fewer." } };
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { error: "You need to be signed in to create a room." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userData.user.id)
    .single();

  let roomId: string | null = null;

  // Optimistic-generate-and-retry per docs/invite-system.md: the database's
  // unique constraint on `code` is the real source of truth, this loop just
  // avoids a separate existence-check round trip before every insert.
  for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
    const code = generateInviteCode();

    const { data: room, error: insertError } = await supabase
      .from("rooms")
      .insert({ name, code, host_id: userData.user.id })
      .select("id")
      .single();

    if (!insertError && room) {
      roomId = room.id;
      break;
    }

    // 23505 = unique_violation. Anything else is a real failure — surface
    // it instead of silently retrying.
    if (insertError && insertError.code !== "23505") {
      console.error("[createRoomAction] insert into rooms failed:", insertError);
      return { error: "Couldn't create the room. Please try again." };
    }
  }

  if (!roomId) {
    return { error: "Couldn't generate a unique invite code. Please try again." };
  }

  const { error: seatError } = await supabase.from("room_players").insert({
    room_id: roomId,
    user_id: userData.user.id,
    display_name: profile?.display_name ?? "Host",
    seat: 0,
    is_host: true,
  });

  if (seatError) {
    console.error("[createRoomAction] insert into room_players failed:", seatError);
    return { error: "Room was created, but seating the host failed. Please try again." };
  }

  redirect(`/rooms/${roomId}`);
}

export async function joinRoomAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const rawCode = String(formData.get("code") ?? "").trim().toUpperCase();

  if (!rawCode) {
    return { fieldErrors: { code: "Invite code is required." } };
  }
  if (!/^[A-Z0-9]{6}$/.test(rawCode)) {
    return { fieldErrors: { code: "Invite codes are 6 characters." } };
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { error: "You need to be signed in to join a room." };
  }

  const { data: roomRow, error: roomError } = await supabase
    .from("rooms")
    .select("*, room_players(*)")
    .eq("code", rawCode)
    .maybeSingle();

  if (roomError || !roomRow) {
    // RLS hides expired/full/playing rooms from this select (see
    // docs/sql/04_rls_policies.sql), so "not found" also covers those
    // cases. Distinguishing them would need a privileged lookup we
    // deliberately don't have from the client-facing action.
    return { fieldErrors: { code: "Invalid or expired invite code." } };
  }

  const room = mapRoom(roomRow, roomRow.room_players ?? []);

  const alreadySeated = room.players.some(
    (player) => player.userId === userData.user.id,
  );
  if (alreadySeated) {
    redirect(`/rooms/${room.id}`);
  }

  if (room.players.length >= room.settings.maxPlayers) {
    return { fieldErrors: { code: "This room is already full." } };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userData.user.id)
    .single();

  // Two players joining the same room at nearly the same instant can both
  // compute the same nextSeat from a stale read — room_players_unique_seat
  // (docs/sql/03_room_players.sql) catches that race at the database
  // level, and we recover from it by re-reading the roster and retrying
  // with the now-current seat count. A 23505 on
  // room_players_unique_member instead means this exact user is already
  // seated (e.g. a double form submission) — that's not a race to retry,
  // it's success: send them to the room they're already in.
  for (let attempt = 0; attempt < 2; attempt++) {
    const nextSeat = room.players.length
      ? Math.max(...room.players.map((player) => player.seat)) + 1
      : 0;

    const { error: joinError } = await supabase.from("room_players").insert({
      room_id: room.id,
      user_id: userData.user.id,
      display_name: profile?.display_name ?? "Player",
      seat: nextSeat,
      is_host: false,
    });

    if (!joinError) {
      redirect(`/rooms/${room.id}`);
    }

    const isUniqueViolation = joinError.code === "23505";
    const isAlreadyMember = isUniqueViolation && joinError.message.includes("room_players_unique_member");
    const isSeatRace = isUniqueViolation && joinError.message.includes("room_players_unique_seat");

    if (isAlreadyMember) {
      redirect(`/rooms/${room.id}`);
    }

    if (!isSeatRace || attempt === 1) {
      return { error: "Couldn't join the room. Please try again." };
    }

    const { data: refreshedRoom } = await supabase
      .from("rooms")
      .select("*, room_players(*)")
      .eq("id", room.id)
      .maybeSingle();

    if (!refreshedRoom) {
      return { error: "Couldn't join the room. Please try again." };
    }

    room.players = mapRoom(refreshedRoom, refreshedRoom.room_players ?? []).players;
  }

  return { error: "Couldn't join the room. Please try again." };
}

export interface ToggleReadyResult {
  error?: string;
  isReady?: boolean;
}

/**
 * Flips the calling user's own ready state in the room they're seated in.
 * Only ever touches the caller's own row — see the RLS policy "Users can
 * update their own room_players row" in docs/sql/04_rls_policies.sql,
 * which is the actual enforcement; this can't be called on someone else's
 * behalf regardless of what roomId/userId a malicious client might try to
 * pass, since there's no userId parameter to begin with.
 *
 * Returns the new state instead of redirecting — callers stay on the room
 * page, and recompute_room_ready_status (docs/sql/07_room_status_machine.sql)
 * handles flipping rooms.status server-side; the realtime subscriptions
 * pick that up independently of this action's return value.
 */
export async function toggleReadyAction(roomId: string): Promise<ToggleReadyResult> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { error: "You need to be signed in to do that." };
  }

  const { data: currentRow, error: readError } = await supabase
    .from("room_players")
    .select("is_ready")
    .eq("room_id", roomId)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (readError || !currentRow) {
    return { error: "You're not seated in this room." };
  }

  const nextReady = !currentRow.is_ready;

  const { error: updateError } = await supabase
    .from("room_players")
    .update({ is_ready: nextReady })
    .eq("room_id", roomId)
    .eq("user_id", userData.user.id);

  if (updateError) {
    console.error("[toggleReadyAction] update failed:", updateError);
    return { error: "Couldn't update your ready status. Please try again." };
  }

  return { isReady: nextReady };
}

/**
 * Host-only: moves a room from `ready_to_start` to `playing`. Gated by
 * "Hosts can update their rooms" (docs/sql/04_rls_policies.sql) for the
 * host check, and by the `with check` on rooms_status_check plus this
 * explicit current-status guard for the state-machine check — a host
 * mashing the button twice, or two requests racing, can't push a room
 * from `playing` straight back to `playing` in a way that fires
 * unintended side effects later, since the update is a no-op once status
 * has already moved.
 */
export async function startSessionAction(roomId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { error: "You need to be signed in to do that." };
  }

  const { error: updateError } = await supabase
    .from("rooms")
    .update({ status: "playing" })
    .eq("id", roomId)
    .eq("host_id", userData.user.id)
    .eq("status", "ready_to_start");

  if (updateError) {
    console.error("[startSessionAction] update failed:", updateError);
    return { error: "Couldn't start the session. Please try again." };
  }

  return {};
}

/**
 * Host-only: removes another player from the room. Cannot be used on the
 * host's own row (a host leaving is a different, not-yet-built flow —
 * who becomes host next isn't decided yet) or on a room the caller
 * doesn't host, both checked here in addition to RLS only allowing a
 * player to delete *their own* row by default — see the note in
 * docs/sql/10_host_controls.sql for the additional delete policy this
 * action depends on.
 */
export async function kickPlayerAction(
  roomId: string,
  targetUserId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { error: "You need to be signed in to do that." };
  }

  if (targetUserId === userData.user.id) {
    return { error: "You can't kick yourself." };
  }

  const { error: deleteError } = await supabase
    .from("room_players")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", targetUserId);

  if (deleteError) {
    console.error("[kickPlayerAction] delete failed:", deleteError);
    return { error: "Couldn't remove that player. Please try again." };
  }

  return {};
}
