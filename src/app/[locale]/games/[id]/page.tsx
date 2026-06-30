import { setRequestLocale, getTranslations } from "next-intl/server";
import PlaceholderPage from "@/components/ui/PlaceholderPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "GameDetailPage" });
  return { title: t("title") };
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("GameDetailPage");

  return (
    <PlaceholderPage
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      meta={id}
    />
  );
}
