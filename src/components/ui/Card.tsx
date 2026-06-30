import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "solid" | "glass";
  hover?: boolean;
  as?: "div" | "article";
}

export default function Card({
  children,
  className,
  variant = "solid",
  hover = false,
  as: Tag = "div",
}: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border p-6 transition-all duration-300 ease-out",
        variant === "solid" && "border-border bg-surface",
        variant === "glass" &&
          "border-white/10 bg-white/[0.04] backdrop-blur-xl supports-[backdrop-filter]:bg-white/[0.04]",
        hover &&
          "hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_16px_40px_-20px_rgba(124,106,247,0.45)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
