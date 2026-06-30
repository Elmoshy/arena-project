import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { Room } from "@/features/rooms/types";

const STATUS_VARIANT: Record<Room["status"], "outline" | "solid"> = {
  waiting: "solid",
  ready_to_start: "solid",
  playing: "outline",
  finished: "outline",
};

export default async function RoomCard({ room }: { room: Room }) {
  const t = await getTranslations("RoomCard");

  return (
    <Link href={`/rooms/${room.id}`} className="block">
      <Card hover className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-text">
            {room.name}
          </h3>
          <Badge variant={STATUS_VARIANT[room.status]}>
            {t(`status.${room.status}`)}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm text-muted">
          <span className="font-mono tracking-widest">{room.code}</span>
          <span>
            {t("playerCount", {
              count: room.players.length,
              max: room.settings.maxPlayers,
            })}
          </span>
        </div>
      </Card>
    </Link>
  );
}
