/**
 * Convenience re-export of every feature module's public surface.
 * Prefer importing from the specific feature (e.g. `@/features/rooms`)
 * in feature-local code; use this barrel for cross-cutting code that
 * genuinely needs several domains at once.
 */
export * from "./auth";
export * from "./rooms";
export * from "./games";
export * from "./players";
export * from "./friends";
