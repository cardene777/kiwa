import type {
  AuthAccount,
  AuthDatabaseAdapter,
  AuthProfile,
  AuthUser,
  SessionStrategy,
} from './types.js';

let sessionCounter = 0;

function nextSessionToken(strategy: SessionStrategy, userId: string): string {
  sessionCounter += 1;
  return `${strategy}-session-${sessionCounter}-${userId}`;
}

/**
 * Parse the userId embedded in a session token issued by {@link issueSession}.
 * Returns `null` when the token was not issued by this mock.
 */
export function parseSessionTokenUserId(sessionToken: string): string | null {
  const match = /^(?:jwt|database)-session-\d+-(user-\d+)$/.exec(sessionToken);
  return match ? match[1]! : null;
}

/**
 * Materialise a profile into a persisted user / account pair, mirroring the
 * flow that NextAuth's `signIn` callback runs when a real provider returns.
 */
export async function upsertUserFromProfile(
  database: AuthDatabaseAdapter,
  profile: AuthProfile,
): Promise<AuthUser> {
  const linked = await database.getUserByAccount({
    provider: profile.provider,
    providerAccountId: profile.providerAccountId,
  });
  if (linked) return linked;

  const existing = await database.getUserByEmail(profile.email);
  const user =
    existing ??
    (await database.createUser({
      email: profile.email,
      ...(profile.name !== undefined ? { name: profile.name } : {}),
    }));

  const account: AuthAccount = {
    userId: user.id,
    provider: profile.provider,
    providerAccountId: profile.providerAccountId,
    type: profile.provider === 'email' ? 'email' : 'oauth',
  };
  await database.linkAccount(account);
  return user;
}

/**
 * Issue a session token for a signed-in user. The JWT strategy short-circuits
 * database writes; the database strategy persists the session row.
 */
export async function issueSession(
  database: AuthDatabaseAdapter,
  user: AuthUser,
  strategy: SessionStrategy,
  maxAgeSeconds: number,
): Promise<{ sessionToken: string; expires: Date }> {
  const sessionToken = nextSessionToken(strategy, user.id);
  const expires = new Date(Date.now() + maxAgeSeconds * 1000);
  if (strategy === 'database') {
    await database.createSession({ sessionToken, userId: user.id, expires });
  }
  return { sessionToken, expires };
}

/** Test-only reset — restart the internal session counter. */
export function __resetSessionCounter(): void {
  sessionCounter = 0;
}
