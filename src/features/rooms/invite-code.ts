/**
 * Invite code generation per docs/invite-system.md: 6 characters from a
 * 32-character alphabet that excludes 0/O and 1/I/L (commonly confused
 * when read aloud or typed on a phone keyboard). Uniqueness is enforced
 * by the database (`rooms_code` unique constraint, see
 * docs/sql/02_rooms.sql) — this function only produces a candidate;
 * the caller retries on a unique-constraint violation.
 */

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

export function generateInviteCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);

  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}
