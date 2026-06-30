"use client";

import { useTranslations } from "next-intl";
import Badge from "@/components/ui/Badge";
import type { RoomPlayer } from "@/features/rooms/types";

interface PlayerRowProps {
  player: RoomPlayer;
  isOnline: boolean;
  /** Whether the current viewer can kick this row's player — host viewing someone else's row. Computed by the caller since it depends on viewer identity, not just this row's data. */
  canKick: boolean;
  onKick?: (userId: string) => void;
  kicking?: boolean;
}

export default function PlayerRow({
  player,
  isOnline,
  canKick,
  onKick,
  kicking,
}: PlayerRowProps) {
  const t = useTranslations("RoomDetailPage");

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3.5 py-2.5">
      <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-text">
        <span
          className={isOnline ? "text-emerald-400" : "text-muted/50"}
          aria-hidden="true"
        >
          {isOnline ? "●" : "○"}
        </span>
        <span className="truncate">{player.displayName}</span>
        {player.isHost ? <Badge variant="solid">{t("hostBadge")}</Badge> : null}
      </span>

      <span className="flex shrink-0 items-center gap-2">
        <Badge
          variant="dot"
          dotColor={isOnline ? "bg-emerald-400" : "bg-muted"}
        >
          {isOnline ? t("onlineBadge") : t("offlineBadge")}
        </Badge>
        <Badge variant={player.isReady ? "solid" : "outline"}>
          {player.isReady ? t("readyBadge") : t("notReadyBadge")}
        </Badge>
        {canKick ? (
          <button
            type="button"
            onClick={() => onKick?.(player.userId)}
            disabled={kicking}
            className="text-xs font-medium text-red-400 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            {kicking ? t("kickingPending") : t("kickAction")}
          </button>
        ) : null}
      </span>
    </li>
  );
}
