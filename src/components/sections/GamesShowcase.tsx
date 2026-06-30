"use client";

import { useTranslations } from "next-intl";
import SectionTitle from "@/components/ui/SectionTitle";
import GameCardGrid from "@/components/ui/GameCardGrid";
import Section from "@/components/ui/Section";

export default function GamesShowcase() {
  const t = useTranslations("Games");

  return (
    <Section divided tinted>
      <SectionTitle eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      <div className="mt-14">
        <GameCardGrid />
      </div>
    </Section>
  );
}
