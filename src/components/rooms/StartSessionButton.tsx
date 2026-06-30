"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { startSessionAction } from "@/features/rooms/actions";
import Button from "@/components/ui/Button";

interface StartSessionButtonProps {
  roomId: string;
  /** Disabled until the room's status (from the realtime subscription, not a local guess) is actually "ready_to_start" — the host can't will this true by clicking faster than recompute_room_ready_status runs. */
  canStart: boolean;
}

export default function StartSessionButton({
  roomId,
  canStart,
}: StartSessionButtonProps) {
  const t = useTranslations("RoomDetailPage");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await startSessionAction(roomId);
      if (result.error) {
        setError(result.error);
      }
      // No optimistic update and no client-side redirect on success: the
      // room's status flipping to "playing" arrives through
      // useSubscribeRoom like any other realtime change, and what the
      // page does in response to "playing" is a future phase's gameplay
      // concern, not this button's.
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        type="button"
        variant="primary"
        onClick={handleClick}
        disabled={!canStart || isPending}
        className="px-8 py-3"
      >
        {isPending ? t("startSessionPending") : t("startSessionAction")}
      </Button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      {!canStart ? (
        <p className="text-xs text-muted">{t("startSessionHint")}</p>
      ) : null}
    </div>
  );
}
