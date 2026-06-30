import { cn } from "@/lib/utils";

interface GridBackgroundProps {
  className?: string;
  cell?: number;
  /** CSS mask-image value controlling where the grid fades out. */
  mask?: string;
}

export default function GridBackground({
  className,
  cell = 56,
  mask = "radial-gradient(ellipse 60% 55% at 50% 35%, black, transparent)",
}: GridBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("absolute inset-0", className)}
      style={{
        backgroundImage:
          "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
        backgroundSize: `${cell}px ${cell}px`,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
}
