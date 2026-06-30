import { getTranslations } from "next-intl/server";
import Section from "@/components/ui/Section";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <Section>
      <div className="mx-auto flex max-w-xl flex-col items-center gap-5 py-12 text-center">
        <Badge variant="dot" className="text-primary">
          {t("eyebrow")}
        </Badge>
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-text sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-muted">{t("description")}</p>
        <Button href="/" variant="primary" className="mt-2">
          {t("cta")}
        </Button>
      </div>
    </Section>
  );
}

// Note: this file lives at src/app/[locale]/not-found.tsx and is only
// reachable for paths *inside* the [locale] segment (e.g. notFound() in a
// page, or a path matching the segment but no concrete route). A request
// to a path outside any locale prefix falls back to Next.js's root
// not-found instead — acceptable here since proxy.ts's matcher routes
// virtually everything through the locale prefix already.
