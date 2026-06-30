import { cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";

interface SectionTitleProps {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "start";
  className?: string;
}

export default function SectionTitle({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-start",
        className,
      )}
    >
      <Badge variant="dot" className="text-primary">
        {eyebrow}
      </Badge>
      <h2 className="text-3xl font-bold leading-tight text-text sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "max-w-xl text-balance text-base text-muted sm:text-lg",
            align === "center" ? "mx-auto" : "",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
