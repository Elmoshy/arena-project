"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import SectionTitle from "@/components/ui/SectionTitle";
import Section from "@/components/ui/Section";
import { fadeUp, viewportOnce } from "@/lib/animations";

export default function HowItWorks() {
  const t = useTranslations("HowItWorks");
  const steps = t.raw("steps") as { title: string; description: string }[];

  return (
    <Section id="how-it-works" divided>
      <div className="mx-auto max-w-5xl">
        <SectionTitle eyebrow={t("eyebrow")} title={t("title")} />

        <div className="relative mt-16 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={viewportOnce}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="rtl:[--tw-origin:right] [--tw-origin:left] pointer-events-none absolute top-6 hidden h-px w-full origin-[var(--tw-origin)] bg-gradient-to-r from-primary/60 via-border to-transparent sm:block"
            aria-hidden="true"
          />

          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              custom={index * 0.12}
              viewport={viewportOnce}
              className="relative flex flex-col gap-3"
            >
              <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-primary/50 bg-background font-[family-name:var(--font-heading)] text-sm font-bold text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-lg font-bold text-text">{step.title}</h3>
              <p className="text-sm text-muted">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}
