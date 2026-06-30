import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  /** Use a narrower measure for text-heavy content like FAQ. */
  size?: "default" | "narrow";
}

export default function Container({
  children,
  className,
  size = "default",
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-6",
        size === "default" ? "max-w-6xl" : "max-w-3xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
