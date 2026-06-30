/**
 * Single source of truth for the Arena design system.
 * Mirrors the @theme tokens in globals.css — kept in sync manually
 * since SVG fills, gradients, and Framer Motion values can't read
 * CSS variables directly in every context.
 */

export const colors = {
  background: "#05070d",
  surface: "#0e121a",
  surfaceHover: "#131826",
  border: "#1c2230",
  primary: "#7c6af7",
  primaryMuted: "#473d8f",
  text: "#f5f5f5",
  muted: "#8a8f98",
} as const;

export const spacing = {
  xs: "0.5rem",
  sm: "0.75rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
  "3xl": "4.5rem",
  "4xl": "6rem",
} as const;

export const typography = {
  fontFamilies: {
    heading: "var(--font-syne)",
    body: "var(--font-inter)",
  },
  scale: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
    "6xl": "3.75rem",
  },
  tracking: {
    tight: "-0.02em",
    normal: "0",
    wide: "0.08em",
    widest: "0.2em",
  },
} as const;

export const radius = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  full: "9999px",
} as const;

export const shadows = {
  card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 12px 32px -16px rgba(0,0,0,0.6)",
  glowSm: "0 0 0 1px rgba(124,106,247,0.4), 0 8px 24px -8px rgba(124,106,247,0.65)",
  glowLg: "0 0 0 1px rgba(124,106,247,0.6), 0 12px 32px -6px rgba(124,106,247,0.85)",
} as const;

export const motion = {
  ease: [0.16, 1, 0.3, 1] as const,
  durationFast: 0.25,
  durationBase: 0.5,
  durationSlow: 0.8,
} as const;
