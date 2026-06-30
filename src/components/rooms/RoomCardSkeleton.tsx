export default function RoomCardSkeleton() {
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6"
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="h-5 w-32 animate-pulse rounded bg-muted/30" />
        <div className="h-5 w-16 animate-pulse rounded-full bg-muted/20" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 animate-pulse rounded bg-muted/20" />
        <div className="h-4 w-24 animate-pulse rounded bg-muted/20" />
      </div>
    </div>
  );
}
