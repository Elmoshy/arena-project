# Invite System

Design only — no generator is implemented yet.

## Format

```
ABCD12
```

6 characters, uppercase, drawn from an alphabet that excludes characters
people commonly misread when read aloud or typed on a phone keyboard:

```
Letters: A B C D E F G H J K L M N P Q R S T U V W X Y Z   (no I, O)
Digits:  2 3 4 5 6 7 8 9                                    (no 0, 1)
```

That's a 32-character alphabet. Codes are not split letters-then-digits —
any of the 6 positions can be a letter or a digit — `"ABCD12"` is just one
possible result, not a fixed pattern.

## Generation strategy

1. Generate 6 random characters from the 32-character alphabet above
   (cryptographically random, not `Math.random()` — `crypto.randomUUID()`
   or `crypto.getRandomValues()` sliced down).
2. Check `rooms.code` for a collision (`status != 'finished'` rooms only —
   see "Reuse after expiry" below).
3. If a collision occurs, regenerate and check again.

## Uniqueness

The alphabet gives `32^6` ≈ 1.07 billion possible codes. With a `unique`
constraint on `rooms.code` at the database level (see
`docs/database-schema.md`), generation is "optimistic": generate, attempt
insert, retry on constraint violation. At Arena's expected scale, the
collision probability per attempt is low enough that a retry loop (capped
at, say, 5 attempts before failing loudly) is simpler and safer than
pre-checking existence in a separate query — the database is the single
source of truth for uniqueness either way.

## Expiration strategy

- Each room's `settings.inviteExpiryMinutes` (default to be decided —
  candidate: 30 minutes) controls how long a generated code stays valid.
- `rooms.expires_at` is set to `created_at + inviteExpiryMinutes` when the
  code is generated.
- An expired code is rejected at join time (step 3 in
  `docs/room-flow.md`), with a clear "this invite has expired" state
  distinct from "room is full" or "room not found" — these are different
  failure states and should not share one generic error.
- The host can regenerate a fresh code for the same room without creating
  a new `Room` row — this resets `code` and pushes `expires_at` forward,
  but does not touch `room_players` (existing seated players are
  unaffected by a code refresh).

### Reuse after expiry

Once a room's `status` becomes `"finished"`, its `code` is no longer
reachable through the join flow, so the uniqueness check above can ignore
finished rooms — letting the ~1 billion-code space effectively never run
out in practice. Whether finished rooms are deleted, archived, or just
ignored is a data-retention decision for a later phase, not this one.
