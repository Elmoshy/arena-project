import type { Variants } from "framer-motion";

export const ease = [0.16, 1, 0.3, 1] as const;

/** Fade in while rising slightly. Accepts a custom delay via `custom`. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease },
  }),
};

/** Plain opacity fade. Accepts a custom delay via `custom`. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.6, delay, ease },
  }),
};

/** Scale + fade in, for cards and badges. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: (delay = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay, ease },
  }),
};

/** Wrap a list of children with this to stagger their entrance. */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

/** Standard viewport config for whileInView scroll reveals. */
export const viewportOnce = { once: true, margin: "-80px" } as const;
