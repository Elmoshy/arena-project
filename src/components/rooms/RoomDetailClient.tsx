"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import PlayerRow from "./PlayerRow";
import ReadyButton from "./ReadyButton";
import StartSessionButton from "./StartSessionButton";
import { kickPlayerAction } from "@/features/rooms/actions";
import {
  useRoomPresence,
  useSubscribeRoom,
  useSubscribePlayers,
} from "@/features/rooms/realtime";
import type { Room } from "@/features/rooms/types";

interface RoomDetailClientProps {
  initialRoom: Room;
  /** The signed-in viewer's own user id — used to find "my" row in the roster and decide what controls to show, not for any access decision (RLS already gated which room/players data reached this page at all). */
  currentUserId: string;
}

/**
 * Composes the three realtime concerns (presence, room status,
 * player roster) and renders the room page's live-updating body.
 * Rendered with `key={initialRoom.id}` by the parent page so that
 * navigating from one room to another fully remounts this component and
 * its hooks, rather than relying on every hook here to notice the id
 * changed and reset itself internally — see the note in
 * realtime/presence.ts.
 */
export default function RoomDetailClient({
  initialRoom,
  currentUserId,
}: RoomDetailClientProps) {
  const t = useTranslations("RoomDetailPage");
  const [kickingUserId, setKickingUserId] = useState<string | null>(null);
  const [kickError, setKickError] = useState<string | null>(null);

  const room = useSubscribeRoom({ roomId: initialRoom.id, initialRoom });
  const players = useSubscribePlayers({
    roomId: initialRoom.id,
    initialPlayers: initialRoom.players,
  });

  const myPlayer = players.find((player) => player.userId === currentUserId);
  const isHost = myPlayer?.isHost ?? false;

  const selfPresence = useMemo(
    () => ({
      userId: currentUserId,
      displayName: myPlayer?.displayName ?? "Player",
      isHost,
    }),
    [currentUserId, myPlayer?.displayName, isHost],
  );

  const { presence } = useRoomPresence({
    roomId: initialRoom.id,
    self: selfPresence,
  });

  async function handleKick(userId: string) {
    setKickError(null);
    setKickingUserId(userId);
    const result = await kickPlayerAction(initialRoom.id, userId);
    setKickingUserId(null);
    if (result.error) {
      setKickError(result.error);
    }
    // No optimistic removal: the kicked row disappearing arrives through
    // useSubscribePlayers' DELETE handler, which every other client in
    // the room (including this one) receives the same way.
  }

  const emptySeats = Math.max(room.settings.maxPlayers - players.length, 0);

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            {t("playersHeading")}
          </h2>
          <Badge variant="outline">
            {t("playerCountLabel", { count: players.length, max: room.settings.maxPlayers })}
          </Badge>
        </div>

        {kickError ? <p className="text-xs text-red-400">{kickError}</p> : null}

        <ul className="flex flex-col gap-2">
          {players
            .slice()
            .sort((a, b) => a.seat - b.seat)
            .map((player) => (
              <PlayerRow
                key={player.id}
                player={player}
                isOnline={Boolean(presence[player.userId])}
                canKick={isHost && player.userId !== currentUserId}
                onKick={handleKick}
                kicking={kickingUserId === player.userId}
              />
            ))}
          {Array.from({ length: emptySeats }).map((_, i) => (
            <li
              key={`empty-${i}`}
              className="flex items-center rounded-lg border border-dashed border-border px-3.5 py-2.5 text-sm text-muted"
            >
              {t("emptySeat")}
            </li>
          ))}
        </ul>
      </Card>

      {room.status === "playing" || room.status === "finished" ? null : (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
          {myPlayer ? (
            <ReadyButton roomId={initialRoom.id} isReady={myPlayer.isReady} />
          ) : null}
          {isHost ? (
            <StartSessionButton
              roomId={initialRoom.id}
              canStart={room.status === "ready_to_start"}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
