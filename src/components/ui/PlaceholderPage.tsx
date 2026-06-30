import Section from "@/components/ui/Section";
import Badge from "@/components/ui/Badge";

interface PlaceholderPageProps {
  eyebrow: string;
  title: string;
  description: string;
  /** Optional route param to surface, e.g. a room or game id, while routing has no real data behind it yet. */
  meta?: string;
}

export default function PlaceholderPage({
  eyebrow,
  title,
  description,
  meta,
}: PlaceholderPageProps) {
  return (
    <Section>
      <div className="mx-auto flex max-w-xl flex-col items-center gap-5 py-12 text-center">
        <Badge variant="dot" className="text-primary">
          {eyebrow}
        </Badge>
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-text sm:text-4xl">
          {title}
        </h1>
        <p className="text-muted">{description}</p>
        {meta ? (
          <Badge
            variant="outline"
            className="mt-1 font-mono normal-case tracking-normal"
          >
            {meta}
          </Badge>
        ) : null}
        <div
          className="mt-8 grid grid-cols-3 gap-1.5 opacity-30"
          aria-hidden="true"
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-sm bg-muted" />
          ))}
        </div>
      </div>
    </Section>
  );
}
