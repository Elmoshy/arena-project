import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: "outline" | "solid" | "dot";
  /** Only used when variant="dot". Defaults to the brand color; pass e.g. "bg-emerald-400" for an online indicator or "bg-muted" for offline. */
  dotColor?: string;
}

export default function Badge({
  children,
  className,
  variant = "outline",
  dotColor = "bg-primary",
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
        variant === "outline" && "border border-border text-muted",
        variant === "solid" && "bg-primary/15 text-primary",
        variant === "dot" &&
          "border border-border bg-surface/80 normal-case tracking-normal",
        className,
      )}
    >
      {variant === "dot" ? (
        <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} aria-hidden="true" />
      ) : null}
      {children}
    </span>
  );
}
