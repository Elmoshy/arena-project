# Testing Realtime Locally

Presence, the player roster, and ready/status updates only show their
realtime behavior when at least two separate browser sessions are open at
once — a single tab can verify the UI renders, but "did the *other*
person's screen update without a refresh" needs a second, independently
authenticated session.

## Setup: two sessions, not two tabs

Two regular tabs in the same browser **share cookies and therefore the
same logged-in user** — you'd just be looking at one player's view twice,
not two players. Use one of these instead:

1. **Two different browsers** (e.g. Chrome + Firefox), each logged into a
   different account. Simplest option, no extra setup.
2. **One browser, one regular window + one Incognito/Private window.**
   Incognito gets its own cookie jar, so it can hold a second login. Works
   in one browser, but Incognito windows sometimes throttle background
   tabs more aggressively — if presence seems to lag specifically in an
   Incognito window that's been unfocused a while, that's the browser, not
   the app.
3. **Two different browser *profiles*** (Chrome profiles, Firefox
   containers). Same idea as Incognito but without the throttling
   quirks — worth the extra minute of setup if you're testing
   reconnection behavior specifically.

You'll need two registered accounts either way (`/register` in each
session).

## Test 1 — Basic presence

1. **Session A**: log in, go to `/rooms/create`, create a room. You land
   on `/rooms/[id]`.
2. **Session A**: copy the invite code shown on the room page.
3. **Session B**: log in, go to `/rooms/join`, paste the code.
4. **Expected**: within roughly a second of Session B's page finishing
   load, Session A's player list shows Session B's row with a green ●
   and an "Online" badge — **without reloading Session A's page.**
5. **Reverse check**: Session B's player list should likewise show
   Session A (the host) as online, with a "Host" badge next to their
   name.

If new players never appear without a manual reload, see
[Troubleshooting](#troubleshooting) below — this usually means Realtime
isn't receiving events at all, not a UI bug.

## Test 2 — Ready status sync

1. With both sessions still in the room from Test 1, **Session B**: click
   "I'm Ready".
2. **Expected**: Session B's own badge flips to "Ready" immediately
   (optimistic), then **Session A's copy of Session B's row** also flips
   to "Ready" within about a second — confirming the change went through
   Postgres and came back over the wire, not just local state.
3. **Session A**: click "I'm Ready" too.
4. **Expected**: once enough players are ready (`min_ready_players`,
   default 2), **both** sessions' room status badge near the top of the
   page changes from "Waiting for players" to "Ready to start" — at
   roughly the same moment in both sessions, since this is driven by a
   database trigger broadcasting to everyone, not a per-client
   computation.
5. **Session B**: click "Cancel Ready".
6. **Expected**: status badge in both sessions drops back to "Waiting for
   players".

## Test 3 — Host starts the session

1. Get the room back to "Ready to start" (repeat the ready-toggling from
   Test 2 if needed).
2. **Session A** (the host): the "Start Session" button should now be
   enabled. Click it.
3. **Expected**: in **both** sessions, the Ready/Start controls disappear
   (the room's status is no longer `waiting`/`ready_to_start`, so the
   page stops rendering them) — confirming Session B received the status
   change too, not just Session A.

There's no gameplay screen to land on yet — disappearing controls is the
full extent of what "started" currently does. See `PROJECT_LOG.md` for
why.

## Test 4 — Host kicks a player

1. Create a fresh room (Test 3 leaves the room in `"playing"`, which
   currently has no further interaction).
2. Join with a second session as before.
3. **Session A** (host): click "Kick" next to Session B's row.
4. **Expected**: Session B's row disappears from **both** sessions'
   player lists immediately. If you click anything in Session B
   afterward, you should not see Session B able to act as if still
   seated (e.g. "I'm Ready" — if Session B's page hasn't re-rendered to
   hide it yet, clicking it should surface an error rather than silently
   succeeding).

## Test 5 — Reconnection

This is the hardest one to get a clean signal on, because "disconnect" on
a real network is rarely instant or clean. Two ways to test, from easiest
to most realistic:

### 5a. Page refresh (easiest)

1. With two sessions in a room, **Session B**: refresh the page (F5 /
   Cmd+R).
2. **Expected**: Session B briefly disappears from Session A's online
   list (it's a fresh connection, momentarily offline), then reappears
   within a couple seconds once the page reloads and re-tracks presence.
   The player *row itself* never disappears (that's roster data from
   Postgres, unaffected by a refresh) — only the online/offline dot
   should flicker.

### 5b. Simulated network drop (more realistic)

1. Open DevTools in **Session B** (F12 or Cmd+Opt+I).
2. Go to the **Network** tab, find the throttling dropdown (usually says
   "No throttling"), and select **Offline**.
3. **Expected**: within several seconds (Realtime's heartbeat interval
   plus a short grace period), Session A sees Session B go offline (●
   turns into ○) **without Session B's page doing anything visibly
   different** — this is the server-side timeout detecting the dropped
   connection, not a client-reported event.
4. Switch the dropdown back to **No throttling** (or **Online**).
5. **Expected**: Session B automatically reconnects — no manual refresh
   needed — and Session A sees it go back online within a few seconds.
   If Session B *also* toggled ready while offline (it can't — the
   button calls a Server Action over a real network request, which fails
   while offline — but if you're testing a custom change, this is the
   thing to check), confirm the ready state that arrives matches what
   actually got persisted, not a stale local guess.

## Troubleshooting

**A joined player never shows up, even after refreshing.**
Check that `docs/sql/09_realtime_publication.sql` has actually been run —
Postgres Changes silently subscribes successfully but never fires if the
table isn't in the `supabase_realtime` publication. Verify with:
```sql
select tablename from pg_publication_tables where pubname = 'supabase_realtime';
```
Both `rooms` and `room_players` should be listed.

**Presence (online/offline) never updates, but the roster does.**
This points specifically at `docs/sql/08_realtime_authorization.sql` not
being applied, or applied against the wrong project. Presence uses
private channels, which are deny-by-default without those policies —
unlike Postgres Changes (the roster), which inherits the table's existing
RLS automatically. Confirm with:
```sql
select policyname from pg_policies where schemaname = 'realtime' and tablename = 'messages';
```
You should see both `"Room members can read presence and broadcast"` and
`"Room members can send presence and broadcast"`.

**Everything works, but with a multi-second delay.**
Some delay (under ~2s) is normal — Postgres Changes has to detect the
write, authorize it per-subscriber, and push it over the wire. A delay
much longer than that is usually a sign of a busy free-tier project or a
slow connection, not a code issue. Check the Supabase dashboard's
Realtime logs (Project → Realtime → Logs) for the actual event timing if
this matters for what you're debugging.
