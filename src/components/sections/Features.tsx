"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import SectionTitle from "@/components/ui/SectionTitle";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/animations";

function RealtimeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M12 1L3 12.5H10L9 21L19 8.5H12L12 1Z" stroke="var(--color-primary)" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function PrivateRoomsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect x="3.5" y="9.5" width="15" height="10" rx="2" stroke="var(--color-primary)" strokeWidth="1.4" />
      <path d="M6.5 9.5V6.5C6.5 3.74 8.74 1.5 11.5 1.5C14.26 1.5 16.5 3.74 16.5 6.5V9.5" stroke="var(--color-primary)" strokeWidth="1.4" />
      <circle cx="11" cy="14.5" r="1.6" fill="var(--color-primary)" />
    </svg>
  );
}

function CrossPlatformIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.4" stroke="var(--color-primary)" strokeWidth="1.4" />
      <path d="M5 16.5H12" stroke="var(--color-primary)" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="14.5" y="8.5" width="6" height="10" rx="1.2" stroke="var(--color-primary)" strokeWidth="1.4" />
    </svg>
  );
}

function MultilingualIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="9" stroke="var(--color-primary)" strokeWidth="1.4" />
      <path d="M2 11H20M11 2C13.2 4.4 14.3 7.6 14.3 11C14.3 14.4 13.2 17.6 11 20C8.8 17.6 7.7 14.4 7.7 11C7.7 7.6 8.8 4.4 11 2Z" stroke="var(--color-primary)" strokeWidth="1.2" />
    </svg>
  );
}

const icons = [RealtimeIcon, PrivateRoomsIcon, CrossPlatformIcon, MultilingualIcon];

export default function Features() {
  const t = useTranslations("Features");
  const items = t.raw("items") as { title: string; description: string }[];

  return (
    <Section id="features" divided>
      <SectionTitle eyebrow={t("eyebrow")} title={t("title")} />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {items.map((item, index) => {
          const Icon = icons[index];
          return (
            <motion.div key={item.title} variants={fadeUp}>
              <Card variant="glass" hover className="flex h-full flex-col gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Icon />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{item.description}</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </Section>
  );
}
