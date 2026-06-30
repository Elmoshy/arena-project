"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toggleReadyAction } from "@/features/rooms/actions";
import Button from "@/components/ui/Button";

interface ReadyButtonProps {
  roomId: string;
  isReady: boolean;
}

/**
 * Optimistic toggle: flips its own displayed state immediately on click,
 * then reconciles with the server's response. The room page's actual
 * source of truth for `isReady` is the realtime subscription
 * (useSubscribePlayers), which will independently confirm this within
 * roughly the same round-trip — this local optimism is purely about not
 * making the button feel laggy while that confirmation is in flight.
 */
export default function ReadyButton({ roomId, isReady }: ReadyButtonProps) {
  const t = useTranslations("RoomDetailPage");
  const [optimisticReady, setOptimisticReady] = useState(isReady);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    setOptimisticReady((current) => !current);
    startTransition(async () => {
      const result = await toggleReadyAction(roomId);
      if (result.error) {
        setOptimisticReady(isReady);
        setError(result.error);
      } else if (result.isReady !== undefined) {
        setOptimisticReady(result.isReady);
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        type="button"
        variant={optimisticReady ? "secondary" : "primary"}
        onClick={handleClick}
        disabled={isPending}
        className="px-8 py-3"
      >
        {optimisticReady ? t("unreadyAction") : t("readyAction")}
      </Button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
