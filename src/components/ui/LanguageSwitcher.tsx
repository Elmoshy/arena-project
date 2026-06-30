"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { routing } from "@/lib/i18n/routing";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();

  function switchTo(nextLocale: string) {
    router.replace(
      // @ts-expect-error -- pathname comes from the typed routing config at runtime
      { pathname, params },
      { locale: nextLocale },
    );
  }

  return (
    <div
      className="inline-flex items-center rounded-full border border-border bg-surface p-1 text-xs font-semibold"
      role="group"
      aria-label={t("label")}
    >
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => switchTo(loc)}
          aria-pressed={locale === loc}
          className={cn(
            "rounded-full px-3 py-1.5 uppercase tracking-wide transition-colors duration-200",
            locale === loc
              ? "bg-primary text-white"
              : "text-muted hover:text-text",
          )}
        >
          {loc}
        </button>
      ))}
    </div>
  );
}
