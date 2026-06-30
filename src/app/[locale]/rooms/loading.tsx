import Section from "@/components/ui/Section";
import RoomCardSkeleton from "@/components/rooms/RoomCardSkeleton";

export default function RoomsLoading() {
  return (
    <Section>
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-5 w-20 animate-pulse rounded-full bg-muted/20" />
        <div className="h-9 w-64 animate-pulse rounded bg-muted/30" />
        <div className="h-4 w-80 animate-pulse rounded bg-muted/20" />
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <RoomCardSkeleton key={i} />
        ))}
      </div>
    </Section>
  );
}
