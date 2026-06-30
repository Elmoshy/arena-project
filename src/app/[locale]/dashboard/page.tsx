import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import RoomCard from "@/components/rooms/RoomCard";
import { getCurrentProfile } from "@/features/auth";
import { getMyRooms } from "@/features/rooms";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DashboardPage" });
  return { title: t("title") };
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("DashboardPage");

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const rooms = await getMyRooms();
  const recentRooms = rooms.slice(0, 6);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-4xl px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-text sm:text-4xl">
              {t("welcome", { name: profile.displayName })}
            </h1>
            <p className="mt-2 max-w-md text-muted">{t("description")}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button href="/rooms/create" variant="primary">
              {t("createRoomCta")}
            </Button>
            <Button href="/rooms/join" variant="secondary">
              {t("joinRoomCta")}
            </Button>
          </div>
        </div>

        <h2 className="mt-12 text-sm font-semibold uppercase tracking-wide text-muted">
          {t("recentRoomsHeading")}
        </h2>

        <div className="mt-4">
          {recentRooms.length === 0 ? (
            <EmptyState message={t("emptyState")} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {recentRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
