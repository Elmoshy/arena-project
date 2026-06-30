import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Container from "@/components/ui/Container";

interface SectionProps {
  children: ReactNode;
  id?: string;
  className?: string;
  /** Adds a top border, used to separate stacked sections. */
  divided?: boolean;
  /** Tints the section with the surface color instead of the page background. */
  tinted?: boolean;
  containerSize?: "default" | "narrow";
}

export default function Section({
  children,
  id,
  className,
  divided = false,
  tinted = false,
  containerSize = "default",
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "py-24 scroll-mt-16",
        divided && "border-t border-border",
        tinted && "bg-surface/30",
        className,
      )}
    >
      <Container size={containerSize}>{children}</Container>
    </section>
  );
}
