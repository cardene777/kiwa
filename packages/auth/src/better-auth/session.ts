import { randomBytes } from 'node:crypto';
import type {
  BetterAuthDatabaseAdapter,
  BetterAuthSession,
  BetterAuthUser,
} from './types.js';

/**
 * Better Auth session ids are opaque url-safe strings (32-char default). Tokens
 * are separate url-safe strings emitted at session creation time and used as the
 * cookie / bearer value. The mock mirrors both shapes so downstream assertions
 * against length / regex hold up when the real implementation is swapped in.
 */
const SESSION_ID_LENGTH = 32;
const SESSION_TOKEN_LENGTH = 40;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

function randomStr(length: number): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    // Non-null after 0-fill: randomBytes returns exactly `length` bytes.
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}

export function generateSessionId(): string {
  return randomStr(SESSION_ID_LENGTH);
}

export function generateSessionToken(): string {
  return randomStr(SESSION_TOKEN_LENGTH);
}

export async function createSessionFor(
  database: BetterAuthDatabaseAdapter,
  user: BetterAuthUser,
  expirationSeconds: number,
): Promise<BetterAuthSession> {
  const session: BetterAuthSession = {
    id: generateSessionId(),
    userId: user.id,
    expiresAt: new Date(Date.now() + expirationSeconds * 1000),
    token: generateSessionToken(),
  };
  return database.createSession(session);
}

export async function validateSessionByToken(
  database: BetterAuthDatabaseAdapter,
  token: string,
): Promise<{ user: BetterAuthUser; session: BetterAuthSession } | null> {
  const session = await database.getSessionByToken(token);
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await database.deleteSession(session.id);
    return null;
  }
  const user = await database.getUser(session.userId);
  if (!user) {
    await database.deleteSession(session.id);
    return null;
  }
  return { user, session };
}

export async function invalidateSessionsForUser(
  database: BetterAuthDatabaseAdapter,
  userId: string,
): Promise<void> {
  // Single adapter call, no client-side scan — matches Better Auth's helper.
  await database.deleteUserSessions(userId);
}
