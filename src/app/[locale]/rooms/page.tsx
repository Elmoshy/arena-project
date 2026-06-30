import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import Section from "@/components/ui/Section";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import RoomCard from "@/components/rooms/RoomCard";
import { getMyRooms } from "@/features/rooms";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "RoomsPage" });
  return { title: t("title") };
}

export default async function RoomsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("RoomsPage");
  const rooms = await getMyRooms();

  return (
    <Section>
      <div className="flex flex-col items-center gap-3 text-center">
        <Badge variant="dot" className="text-primary">
          {t("eyebrow")}
        </Badge>
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-text sm:text-4xl">
          {t("title")}
        </h1>
        <p className="max-w-md text-muted">{t("description")}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button href="/rooms/create" variant="primary">
            {t("createCta")}
          </Button>
          <Button href="/rooms/join" variant="secondary">
            {t("joinCta")}
          </Button>
        </div>
      </div>

      <div className="mt-12">
        {rooms.length === 0 ? (
          <EmptyState message={t("emptyState")} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </div>

      <p className="mt-10 text-center text-sm text-muted">
        {t("expiredHint")}{" "}
        <Link href="/rooms/join" className="font-medium text-primary hover:underline">
          {t("joinCta")}
        </Link>
      </p>
    </Section>
  );
}
