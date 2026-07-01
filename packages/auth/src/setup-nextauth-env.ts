import { createInMemoryAdapter } from './adapter.js';
import { buildProviderRegistry } from './providers.js';
import { issueSession, parseSessionTokenUserId, upsertUserFromProfile } from './session.js';
import type {
  AuthUser,
  NextAuthTestEnv,
  ProviderKind,
  SessionStrategy,
  SetupNextAuthEnvOptions,
} from './types.js';

const DEFAULT_PROVIDERS: ProviderKind[] = ['google', 'github', 'email'];
const DEFAULT_STRATEGY: SessionStrategy = 'jwt';
const DEFAULT_MAX_AGE = 30 * 24 * 60 * 60; // 30 days, matches NextAuth default.

const KNOWN_STRATEGIES: readonly SessionStrategy[] = ['jwt', 'database'];

export async function setupNextAuthEnv(
  opts: SetupNextAuthEnvOptions = {},
): Promise<NextAuthTestEnv> {
  const strategy = opts.session?.strategy ?? DEFAULT_STRATEGY;
  if (!KNOWN_STRATEGIES.includes(strategy)) {
    throw new Error(`setupNextAuthEnv: unknown session strategy "${String(strategy)}"`);
  }
  const maxAge = opts.session?.maxAge ?? DEFAULT_MAX_AGE;
  const providerKinds = opts.providers ?? DEFAULT_PROVIDERS;
  if (providerKinds.length === 0) {
    throw new Error('setupNextAuthEnv: providers must contain at least one entry');
  }
  const providers = buildProviderRegistry(providerKinds);
  const database = opts.database ?? createInMemoryAdapter();

  async function signIn(
    providerKind: ProviderKind,
    input?: { email?: string; sub?: string; name?: string },
  ): Promise<{
    user: AuthUser;
    session: { sessionToken: string; expires: Date };
    strategy: SessionStrategy;
  }> {
    const provider = providers[providerKind];
    if (!provider) {
      throw new Error(`setupNextAuthEnv: provider "${providerKind}" was not configured`);
    }
    const profile = await provider.signIn(input);
    const user = await upsertUserFromProfile(database, profile);
    const session = await issueSession(database, user, strategy, maxAge);
    return { user, session, strategy };
  }

  async function getSession(sessionToken: string) {
    if (strategy === 'database') {
      const row = await database.getSessionAndUser(sessionToken);
      if (!row) return null;
      if (row.session.expires.getTime() <= Date.now()) return null;
      return { user: row.user, expires: row.session.expires };
    }
    // JWT strategy — we don't persist the session, so recover the user id from
    // the token suffix that `issueSession` embeds. Real NextAuth verifies the
    // JWT signature; the mock trusts the token because it is opaque to callers.
    const userId = parseSessionTokenUserId(sessionToken);
    if (!userId) return null;
    const user = await database.getUser(userId);
    if (!user) return null;
    return { user, expires: new Date(Date.now() + maxAge * 1000) };
  }

  async function signOut(sessionToken: string): Promise<void> {
    if (strategy === 'database') {
      await database.deleteSession(sessionToken);
    }
    // JWT sessions are stateless — nothing to clear.
  }

  const env: NextAuthTestEnv = {
    mode: 'mock',
    session: { strategy, maxAge },
    providers,
    database,
    signIn,
    getSession,
    signOut,
    stop: async () => {
      database.reset();
    },
  };
  return env;
}
