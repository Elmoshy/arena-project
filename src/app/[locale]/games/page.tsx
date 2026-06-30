import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import SectionTitle from "@/components/ui/SectionTitle";
import GameCardGrid from "@/components/ui/GameCardGrid";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "GamesPage" });
  return { title: t("title") };
}

export default async function GamesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("GamesPage");

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionTitle eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
        <div className="mt-14">
          <GameCardGrid />
        </div>
      </div>
    </section>
  );
}
