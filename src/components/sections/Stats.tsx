"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Badge from "@/components/ui/Badge";
import Section from "@/components/ui/Section";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/animations";

interface StatItem {
  value: string;
  suffix: string;
  numeric: boolean;
  label: string;
}

function StatValue({ item }: { item: StatItem }) {
  const [display, setDisplay] = useState(item.numeric ? "0" : item.value);
  const [started, setStarted] = useState(false);

  function startCount() {
    if (started || !item.numeric) return;
    setStarted(true);

    const target = parseInt(item.value, 10);
    if (Number.isNaN(target)) {
      setDisplay(item.value);
      return;
    }

    const duration = 900;
    const startTime = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      setDisplay(String(Math.round(progress * target)));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  return (
    <motion.span
      onViewportEnter={startCount}
      viewport={{ once: true, margin: "-40px" }}
      className="font-[family-name:var(--font-heading)] text-4xl font-extrabold text-text sm:text-5xl"
    >
      {display}
      <span className="text-primary">{item.suffix}</span>
    </motion.span>
  );
}

export default function Stats() {
  const t = useTranslations("Stats");
  const items = t.raw("items") as StatItem[];

  return (
    <Section divided tinted>
      <div className="mb-10 flex justify-center">
        <Badge variant="dot" className="text-primary">
          {t("eyebrow")}
        </Badge>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-y-0 [&>*:not(:first-child)]:sm:border-s [&>*:not(:first-child)]:sm:border-border"
      >
        {items.map((item) => (
          <motion.div
            key={item.label}
            variants={fadeUp}
            className="flex flex-col items-center gap-2 py-8 text-center sm:py-2"
          >
            <StatValue item={item} />
            <span className="text-sm text-muted">{item.label}</span>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
