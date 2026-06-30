"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlowProps {
  className?: string;
  size?: number;
  color?: string;
  /** Adds a slow ambient drift. Disabled by default to respect reduced-motion users. */
  animate?: boolean;
}

export default function Glow({
  className,
  size = 480,
  color = "var(--color-primary)",
  animate = false,
}: GlowProps) {
  const style = {
    width: size,
    height: size,
    background: color,
  };

  if (!animate) {
    return (
      <div
        aria-hidden="true"
        className={cn("absolute rounded-full opacity-25 blur-[120px]", className)}
        style={style}
      />
    );
  }

  return (
    <motion.div
      aria-hidden="true"
      className={cn("absolute rounded-full opacity-25 blur-[120px] motion-reduce:animate-none", className)}
      style={style}
      animate={{
        x: [0, 24, -16, 0],
        y: [0, -18, 14, 0],
      }}
      transition={{
        duration: 14,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}
