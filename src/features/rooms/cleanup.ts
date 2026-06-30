/**
 * Application-level fallback for stale-room cleanup. The primary
 * mechanism is the `cleanup-stale-rooms` pg_cron job (see
 * docs/sql/06_room_cleanup.sql), which runs every minute regardless of
 * whether anyone is using the site. This fallback exists for projects
 * where pg_cron isn't enabled, or as a second line of defense if the
 * scheduled job is ever paused — it calls the same
 * `cleanup_stale_rooms()` database function, just triggered by page
 * traffic instead of a timer.
 *
 * Deliberately fire-and-forget: callers don't await the cleanup or let
 * its failure affect the page they're rendering. A user loading /rooms
 * should never see an error because a background cleanup call failed.
 */
import { createClient } from "@/lib/supabase/server";

let lastRun = 0;
const MIN_INTERVAL_MS = 60_000;

/** Runs cleanup_stale_rooms() at most once per minute per server instance, to avoid firing it on every single page load. */
export function runStaleRoomCleanupFallback(): void {
  const now = Date.now();
  if (now - lastRun < MIN_INTERVAL_MS) return;
  lastRun = now;

  void (async () => {
    try {
      const supabase = await createClient();
      await supabase.rpc("cleanup_stale_rooms");
    } catch {
      // Best-effort only — pg_cron (docs/sql/06_room_cleanup.sql) is the
      // mechanism this app actually relies on for correctness. A failure
      // here just means this particular page load didn't also trigger a
      // cleanup pass, not that cleanup stopped happening.
    }
  })();
}
