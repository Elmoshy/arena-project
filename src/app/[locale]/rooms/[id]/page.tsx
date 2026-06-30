import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import Section from "@/components/ui/Section";
import Badge from "@/components/ui/Badge";
import CopyInviteCode from "@/components/rooms/CopyInviteCode";
import RoomDetailClient from "@/components/rooms/RoomDetailClient";
import { getRoomById } from "@/features/rooms";
import { getCurrentUser } from "@/features/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "RoomDetailPage" });
  return { title: t("title") };
}

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("RoomDetailPage");

  // proxy.ts already guards /rooms against signed-out users; this is a
  // defensive second check so currentUserId below is never undefined —
  // RoomDetailClient needs a real id to find "my" row in the roster.
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const room = await getRoomById(id);

  if (!room) {
    notFound();
  }

  return (
    <Section containerSize="narrow">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Badge variant="dot" className="text-primary">
            {t(`status.${room.status}`)}
          </Badge>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-text sm:text-4xl">
            {room.name}
          </h1>
          <p className="text-muted">{t("inviteHint")}</p>
          <CopyInviteCode code={room.code} />
        </div>

        <RoomDetailClient
          key={room.id}
          initialRoom={room}
          currentUserId={user.id}
        />
      </div>
    </Section>
  );
}
