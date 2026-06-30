"use client";

/**
 * Owns the single Realtime channel for a room: presence tracking
 * (who's online) and the broadcast events in RoomBroadcastEvent. Postgres
 * Changes (roster/ready/status updates) are deliberately NOT handled
 * here — see subscribeRoom.ts and subscribePlayers.ts — because mixing
 * "ephemeral connection state" and "persisted row changes" into one
 * channel/hook makes it unclear which one to trust when they disagree
 * during a reconnect. Keeping them separate means each can resync
 * independently: presence resets to empty and rebuilds from scratch on
 * reconnect, while Postgres Changes resumes once the page's existing
 * server-fetched data is treated as the source of truth until the new
 * subscription's first event arrives.
 *
 * One channel per room, `private: true`, authorized by the RLS policies
 * on realtime.messages in docs/sql/08_realtime_authorization.sql — every
 * client connecting must be the host or a seated player in that room.
 *
 * Callers should mount this hook's owning component with `key={roomId}`
 * (RoomDetailClient does this) rather than relying on this hook to reset
 * its own status to "connecting" internally when roomId changes — remounting
 * is what naturally re-runs every Hook here from a clean slate, and it
 * avoids calling setState synchronously inside the subscribe effect's body
 * (only inside the subscribe() callback, which React treats as an event
 * rather than part of the render-effect cycle).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  roomChannelTopic,
  type PresencePayload,
  type RoomBroadcastEvent,
  type RoomConnectionStatus,
  type RoomPresenceState,
} from "./types";

interface UseRoomPresenceOptions {
  roomId: string;
  /** This client's own presence payload. Re-tracked automatically whenever this value changes (e.g. isHost flips after a transfer-host feature lands later), without needing to leave and rejoin the channel. */
  self: PresencePayload;
  onBroadcast?: (event: RoomBroadcastEvent) => void;
}

interface UseRoomPresenceResult {
  presence: RoomPresenceState;
  status: RoomConnectionStatus;
  /** Sends a broadcast event to everyone else on the room's channel. Resolves once the send completes; does not throw on failure — callers that need to know about delivery failure should check the resolved RealtimeChannelSendResponse-derived boolean themselves in a future iteration if that need arises. */
  broadcast: (event: RoomBroadcastEvent) => Promise<void>;
}

export function useRoomPresence({
  roomId,
  self,
  onBroadcast,
}: UseRoomPresenceOptions): UseRoomPresenceResult {
  const [presence, setPresence] = useState<RoomPresenceState>({});
  const [status, setStatus] = useState<RoomConnectionStatus>("connecting");
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Refs mirroring the latest `self`/`onBroadcast` are updated from an
  // effect rather than during render — writing to `.current` in the
  // component body runs on every render, including ones React may throw
  // away (e.g. under Strict Mode double-invoking, or a future
  // concurrent-rendering path), which is exactly what refs are meant to
  // avoid being used for.
  const selfRef = useRef(self);
  const onBroadcastRef = useRef(onBroadcast);
  useEffect(() => {
    selfRef.current = self;
    onBroadcastRef.current = onBroadcast;
  }, [self, onBroadcast]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(roomChannelTopic(roomId), {
      config: { private: true, presence: { key: self.userId } },
    });
    channelRef.current = channel;

    function syncPresenceState() {
      const rawState = channel.presenceState<PresencePayload>();
      const next: RoomPresenceState = {};
      for (const [userId, entries] of Object.entries(rawState)) {
        if (entries.length === 0) continue;
        // Multiple tabs for the same user produce multiple presence
        // entries under the same key — collapse to one logical entry but
        // keep every presence_ref, so a leave in one tab doesn't read as
        // "user went offline" while another tab is still connected (the
        // LEAVE handler removes refs individually; only an empty refs
        // list means actually offline).
        const [first] = entries;
        next[userId] = {
          userId: first.userId,
          displayName: first.displayName,
          isHost: first.isHost,
          presenceRefs: entries.map((entry) => entry.presence_ref),
        };
      }
      setPresence(next);
    }

    channel
      .on("presence", { event: "sync" }, syncPresenceState)
      .on("broadcast", { event: "room_event" }, ({ payload }) => {
        onBroadcastRef.current?.(payload as RoomBroadcastEvent);
      })
      .subscribe((subscribeStatus) => {
        // setState calls here run inside subscribe()'s callback — an
        // async event from the Realtime client, not the synchronous body
        // of this effect — so they're the kind of "respond to an external
        // system's event" update useEffect is meant for, not the
        // cascading-render pattern the lint rule flags.
        if (subscribeStatus === "SUBSCRIBED") {
          setStatus("connected");
          void channel.track(selfRef.current);
        } else if (subscribeStatus === "TIMED_OUT") {
          setStatus("disconnected");
        } else if (subscribeStatus === "CHANNEL_ERROR") {
          setStatus("error");
        } else if (subscribeStatus === "CLOSED") {
          setStatus("disconnected");
        }
      });

    return () => {
      void channel.untrack();
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // self and onBroadcast are intentionally excluded: re-tracking on a
    // `self` content change is handled by the effect below instead of
    // tearing down and recreating the channel (which would briefly flash
    // this user as offline to everyone else for no reason), and
    // onBroadcast is read through onBroadcastRef so a new function
    // identity on every render doesn't reconnect the channel either.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Re-sends this client's presence payload whenever its content changes
  // (e.g. isHost flips) without rejoining the channel. Destructured
  // primitives rather than `self` itself as dependencies, since a parent
  // re-creating the `self` object literal on every render (a likely
  // pattern, since it's usually built inline from other state) would
  // otherwise re-track on every render instead of only on real changes.
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel || status !== "connected") return;
    void channel.track(self);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally depending on self's primitive fields, not its object identity; see comment above.
  }, [self.userId, self.displayName, self.isHost, status]);

  const broadcast = useCallback(async (event: RoomBroadcastEvent) => {
    const channel = channelRef.current;
    if (!channel) return;
    await channel.send({
      type: "broadcast",
      event: "room_event",
      payload: event,
    });
  }, []);

  return { presence, status, broadcast };
}
