import { createInMemoryLuciaAdapter } from './adapter.js';
import { hashPassword, verifyPassword } from './password.js';
import { buildLuciaProviderRegistry } from './providers.js';
import {
  createSessionFor,
  invalidateSessionsForUser,
  validateSessionId,
} from './session.js';
import type {
  LuciaDatabaseAdapter,
  LuciaProviderKind,
  LuciaTestEnv,
  LuciaUser,
  SetupLuciaEnvOptions,
} from './types.js';

const DEFAULT_PROVIDERS: LuciaProviderKind[] = ['google', 'github'];
const DEFAULT_EXPIRATION_SECONDS = 30 * 24 * 60 * 60; // 30 days, matches Lucia default.

function isBuiltAdapter(
  candidate: SetupLuciaEnvOptions['database'],
): candidate is LuciaDatabaseAdapter {
  return (
    !!candidate &&
    typeof (candidate as LuciaDatabaseAdapter).createUser === 'function' &&
    typeof (candidate as LuciaDatabaseAdapter).createSession === 'function'
  );
}

export async function setupLuciaEnv(
  opts: SetupLuciaEnvOptions = {},
): Promise<LuciaTestEnv> {
  const providerKinds = opts.providers ?? DEFAULT_PROVIDERS;
  if (providerKinds.length === 0) {
    throw new Error('setupLuciaEnv: providers must contain at least one entry');
  }
  const sessionExpiration = opts.sessionExpiration ?? DEFAULT_EXPIRATION_SECONDS;
  if (sessionExpiration <= 0) {
    throw new Error('setupLuciaEnv: sessionExpiration must be a positive number of seconds');
  }
  const providers = buildLuciaProviderRegistry(providerKinds);
  const database: LuciaDatabaseAdapter = isBuiltAdapter(opts.database)
    ? opts.database
    : createInMemoryLuciaAdapter(opts.database?.kind ?? 'sqlite');

  async function signUpWithPassword(input: { email: string; password: string }) {
    if (!input.email) throw new Error('signUpWithPassword: email is required');
    const passwordHash = await hashPassword(input.password);
    const user = await database.createUser({ email: input.email, passwordHash });
    const session = await createSessionFor(database, user, sessionExpiration);
    return { user, session };
  }

  async function signInWithPassword(input: { email: string; password: string }) {
    const user = await database.getUserByEmail(input.email);
    if (!user || !user.passwordHash) {
      throw new Error('signInWithPassword: invalid email or password');
    }
    const ok = await verifyPassword(user.passwordHash, input.password);
    if (!ok) throw new Error('signInWithPassword: invalid email or password');
    const session = await createSessionFor(database, user, sessionExpiration);
    return { user, session };
  }

  async function signInWithOAuth(
    provider: LuciaProviderKind,
    input?: { email?: string; sub?: string },
  ) {
    const providerMock = providers[provider];
    if (!providerMock) {
      throw new Error(`setupLuciaEnv: provider "${provider}" was not configured`);
    }
    const profile = await providerMock.signIn(input);
    const linked = await database.getUserByOAuthAccount({
      provider: profile.provider,
      providerAccountId: profile.providerAccountId,
    });
    let user: LuciaUser;
    if (linked) {
      user = linked;
    } else {
      const existing = await database.getUserByEmail(profile.email);
      user = existing ?? (await database.createUser({ email: profile.email }));
      await database.linkOAuthAccount({
        userId: user.id,
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
      });
    }
    const session = await createSessionFor(database, user, sessionExpiration);
    return { user, session };
  }

  async function validateSession(sessionId: string) {
    return validateSessionId(database, sessionId, sessionExpiration);
  }

  async function invalidateSession(sessionId: string) {
    await database.deleteSession(sessionId);
  }

  async function invalidateUserSessions(userId: string) {
    await invalidateSessionsForUser(database, userId);
  }

  const env: LuciaTestEnv = {
    mode: 'mock',
    database,
    providers,
    sessionExpiration,
    signUpWithPassword,
    signInWithPassword,
    signInWithOAuth,
    validateSession,
    invalidateSession,
    invalidateUserSessions,
    stop: async () => {
      database.reset();
    },
  };
  return env;
}
