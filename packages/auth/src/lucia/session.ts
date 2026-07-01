import { randomBytes } from 'node:crypto';
import type { LuciaDatabaseAdapter, LuciaSession, LuciaUser } from './types.js';

/**
 * Lucia v3 session ids are 40-character url-safe alphabets. The mock keeps the
 * same envelope so downstream assertions on shape (regex, length) hold up when
 * consumers swap the real adapter in.
 */
const SESSION_ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const SESSION_ID_LENGTH = 40;

export function generateSessionId(): string {
  const bytes = randomBytes(SESSION_ID_LENGTH);
  let out = '';
  for (let i = 0; i < SESSION_ID_LENGTH; i += 1) {
    // Non-null after 0-fill: randomBytes returns exactly SESSION_ID_LENGTH bytes.
    out += SESSION_ID_ALPHABET[bytes[i]! % SESSION_ID_ALPHABET.length];
  }
  return out;
}

export async function createSessionFor(
  database: LuciaDatabaseAdapter,
  user: LuciaUser,
  expirationSeconds: number,
): Promise<LuciaSession> {
  const session: LuciaSession = {
    id: generateSessionId(),
    userId: user.id,
    expiresAt: new Date(Date.now() + expirationSeconds * 1000),
    fresh: true,
  };
  return database.createSession(session);
}

/**
 * Validate a session id. Mirrors Lucia's rolling-expiration behaviour:
 * - expired session → delete and return null
 * - session in the refresh window (less than half the lifetime remaining) →
 *   extend `expiresAt` and mark the returned session `fresh: true`
 * - session comfortably valid → return as-is with `fresh: false`
 */
export async function validateSessionId(
  database: LuciaDatabaseAdapter,
  sessionId: string,
  expirationSeconds: number,
): Promise<{ user: LuciaUser; session: LuciaSession } | null> {
  const session = await database.getSession(sessionId);
  if (!session) return null;
  const now = Date.now();
  if (session.expiresAt.getTime() <= now) {
    await database.deleteSession(sessionId);
    return null;
  }
  const user = await database.getUser(session.userId);
  if (!user) {
    await database.deleteSession(sessionId);
    return null;
  }
  const totalMs = expirationSeconds * 1000;
  const remaining = session.expiresAt.getTime() - now;
  if (remaining < totalMs / 2) {
    const extended = await database.updateSession({
      id: sessionId,
      expiresAt: new Date(now + totalMs),
      fresh: true,
    });
    return { user, session: extended ?? { ...session, fresh: true } };
  }
  return { user, session: { ...session, fresh: false } };
}

export async function invalidateSessionsForUser(
  database: LuciaDatabaseAdapter,
  userId: string,
): Promise<void> {
  // Mirrors Lucia's `deleteUserSessions(userId)` — a single adapter call, no
  // client-side scan. The adapter is responsible for the bulk WHERE.
  await database.deleteUserSessions(userId);
}
