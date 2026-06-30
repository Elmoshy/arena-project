"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Glow from "@/components/ui/Glow";
import GridBackground from "@/components/ui/GridBackground";
import Container from "@/components/ui/Container";
import { fadeUp } from "@/lib/animations";

const floatingPieces = [
  { className: "left-[12%] top-[22%] h-10 w-10 rounded-lg border border-primary/30", duration: 7, delay: 0 },
  { className: "right-[14%] top-[28%] h-7 w-7 rounded-full border border-primary/30", duration: 9, delay: 0.4 },
  { className: "left-[18%] bottom-[20%] h-6 w-6 rounded-full border border-border", duration: 8, delay: 0.8 },
  { className: "right-[10%] bottom-[24%] h-9 w-9 rounded-lg border border-border", duration: 10, delay: 0.2 },
];

export default function Hero() {
  const t = useTranslations("Hero");

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden">
      {/* Signature texture: a faint board grid, grounded in the product's subject */}
      <GridBackground />

      <Glow
        animate
        size={520}
        className="left-1/2 top-[28%] -translate-x-1/2 -translate-y-1/2"
      />
      <Glow
        size={320}
        color="var(--color-primary-muted)"
        className="left-[20%] top-[60%] opacity-15"
      />

      {/* Floating board-piece motifs — decorative, restrained, no particle system */}
      {floatingPieces.map((piece, index) => (
        <motion.span
          key={index}
          aria-hidden="true"
          className={`absolute hidden motion-reduce:animate-none sm:block ${piece.className}`}
          animate={{ y: [0, -14, 0] }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <Container className="relative flex flex-col items-center py-24 text-center">
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
          <Badge variant="dot" className="mb-8 text-muted">
            {t("eyebrow")}
          </Badge>
        </motion.div>

        <h1 className="font-[family-name:var(--font-heading)] text-4xl font-extrabold leading-[1.08] tracking-tight text-text sm:text-6xl">
          <motion.span variants={fadeUp} initial="hidden" animate="show" custom={0.1} className="block">
            {t("headlineLine1")}
          </motion.span>
          <motion.span variants={fadeUp} initial="hidden" animate="show" custom={0.2} className="block text-primary">
            {t("headlineLine2")}
          </motion.span>
          <motion.span variants={fadeUp} initial="hidden" animate="show" custom={0.3} className="block">
            {t("headlineLine3")}
          </motion.span>
        </h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0.45}
          className="mt-7 max-w-xl text-balance text-base text-muted sm:text-lg"
        >
          {t("description")}
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0.6}
          className="mt-10 flex flex-col gap-3 sm:flex-row"
        >
          <Button href="/register" variant="primary">
            {t("ctaPrimary")}
          </Button>
          <Button href="/games" variant="secondary">
            {t("ctaSecondary")}
          </Button>
        </motion.div>
      </Container>
    </section>
  );
}
