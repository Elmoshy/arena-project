"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import SectionTitle from "@/components/ui/SectionTitle";
import Section from "@/components/ui/Section";
import { fadeUp, viewportOnce } from "@/lib/animations";

interface FaqItem {
  question: string;
  answer: string;
}

export default function FAQ() {
  const t = useTranslations("FAQ");
  const items = t.raw("items") as FaqItem[];
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Section id="faq" divided containerSize="narrow">
      <SectionTitle eyebrow={t("eyebrow")} title={t("title")} />

      <div className="mt-12 flex flex-col">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          const panelId = `${baseId}-panel-${index}`;
          const buttonId = `${baseId}-button-${index}`;

          return (
            <motion.div
              key={item.question}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              custom={index * 0.06}
              viewport={viewportOnce}
              className="border-b border-border"
            >
              <h3>
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-start text-base font-semibold text-text transition-colors duration-200 hover:text-primary"
                >
                  {item.question}
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-muted"
                  >
                    <motion.svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </motion.svg>
                  </span>
                </button>
              </h3>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-5 pe-10 text-sm text-muted">{item.answer}</p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
