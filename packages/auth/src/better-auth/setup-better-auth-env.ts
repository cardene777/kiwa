import { createInMemoryBetterAuthAdapter } from './adapter.js';
import { hashPassword, verifyPassword } from './password.js';
import { buildBetterAuthProviderRegistry } from './providers.js';
import {
  createSessionFor,
  invalidateSessionsForUser,
  validateSessionByToken,
} from './session.js';
import { generateTotpCode, generateTotpSecret, verifyTotpCode } from './totp.js';
import { generateVerificationToken } from './verification.js';
import type {
  BetterAuthDatabaseAdapter,
  BetterAuthPluginKind,
  BetterAuthProviderKind,
  BetterAuthTestEnv,
  BetterAuthUser,
  SetupBetterAuthEnvOptions,
} from './types.js';

const DEFAULT_PROVIDERS: BetterAuthProviderKind[] = ['google', 'github'];
const DEFAULT_PLUGINS: BetterAuthPluginKind[] = ['emailAndPassword'];
// Better Auth session cookie lifetime default = 7 days.
const DEFAULT_SESSION_EXPIRATION = 7 * 24 * 60 * 60;
// Better Auth magic-link default expiry = 15 minutes.
const DEFAULT_VERIFICATION_EXPIRATION = 15 * 60;

function isBuiltAdapter(
  candidate: SetupBetterAuthEnvOptions['database'],
): candidate is BetterAuthDatabaseAdapter {
  return (
    !!candidate &&
    typeof (candidate as BetterAuthDatabaseAdapter).createUser === 'function' &&
    typeof (candidate as BetterAuthDatabaseAdapter).createSession === 'function'
  );
}

export async function setupBetterAuthEnv(
  opts: SetupBetterAuthEnvOptions = {},
): Promise<BetterAuthTestEnv> {
  const providerKinds = opts.providers ?? DEFAULT_PROVIDERS;
  if (providerKinds.length === 0) {
    throw new Error('setupBetterAuthEnv: providers must contain at least one entry');
  }
  const sessionExpiration = opts.sessionExpiration ?? DEFAULT_SESSION_EXPIRATION;
  if (sessionExpiration <= 0) {
    throw new Error(
      'setupBetterAuthEnv: sessionExpiration must be a positive number of seconds',
    );
  }
  const verificationExpiration =
    opts.verificationExpiration ?? DEFAULT_VERIFICATION_EXPIRATION;
  if (verificationExpiration <= 0) {
    throw new Error(
      'setupBetterAuthEnv: verificationExpiration must be a positive number of seconds',
    );
  }
  const pluginList = opts.plugins ?? DEFAULT_PLUGINS;
  const plugins = new Set<BetterAuthPluginKind>(pluginList);
  const providers = buildBetterAuthProviderRegistry(providerKinds);
  const database: BetterAuthDatabaseAdapter = isBuiltAdapter(opts.database)
    ? opts.database
    : createInMemoryBetterAuthAdapter(opts.database?.kind ?? 'prisma');

  function requirePlugin(kind: BetterAuthPluginKind, method: string): void {
    if (!plugins.has(kind)) {
      throw new Error(
        `setupBetterAuthEnv: ${method} requires the "${kind}" plugin to be enabled`,
      );
    }
  }

  async function signUpWithPassword(input: { email: string; password: string }) {
    requirePlugin('emailAndPassword', 'signUpWithPassword');
    if (!input.email) throw new Error('signUpWithPassword: email is required');
    const passwordHash = await hashPassword(input.password);
    const user = await database.createUser({
      email: input.email,
      passwordHash,
      emailVerified: false,
    });
    const session = await createSessionFor(database, user, sessionExpiration);
    return { user, session };
  }

  async function signInWithPassword(input: { email: string; password: string }) {
    requirePlugin('emailAndPassword', 'signInWithPassword');
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
    provider: BetterAuthProviderKind,
    input?: { email?: string; sub?: string },
  ) {
    const providerMock = providers[provider];
    if (!providerMock) {
      throw new Error(`setupBetterAuthEnv: provider "${provider}" was not configured`);
    }
    const profile = await providerMock.signIn(input);
    const linked = await database.getUserByAccount({
      provider: profile.provider,
      providerAccountId: profile.providerAccountId,
    });
    let user: BetterAuthUser;
    if (linked) {
      user = linked;
    } else {
      const existing = await database.getUserByEmail(profile.email);
      user =
        existing ??
        (await database.createUser({
          email: profile.email,
          emailVerified: true,
        }));
      await database.linkAccount({
        userId: user.id,
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
      });
    }
    const session = await createSessionFor(database, user, sessionExpiration);
    return { user, session };
  }

  async function sendMagicLink(input: { email: string }) {
    requirePlugin('magicLink', 'sendMagicLink');
    if (!input.email) throw new Error('sendMagicLink: email is required');
    const token = generateVerificationToken();
    await database.createVerification({
      identifier: input.email,
      value: token,
      expiresAt: new Date(Date.now() + verificationExpiration * 1000),
    });
    return { token };
  }

  async function consumeMagicLink(input: { email: string; token: string }) {
    requirePlugin('magicLink', 'consumeMagicLink');
    const verification = await database.consumeVerification(input.email, input.token);
    if (!verification) {
      throw new Error('consumeMagicLink: invalid or expired token');
    }
    const existing = await database.getUserByEmail(input.email);
    let user =
      existing ??
      (await database.createUser({
        email: input.email,
        emailVerified: true,
      }));
    // Existing users get their email marked verified on first magic-link click.
    // Reassign so the returned user reflects the updated flag rather than the
    // pre-update snapshot.
    if (existing && !existing.emailVerified) {
      user = await database.updateUser({ id: existing.id, emailVerified: true });
    }
    const session = await createSessionFor(database, user, sessionExpiration);
    return { user, session };
  }

  async function enrollTwoFactor(input: { userId: string }) {
    requirePlugin('twoFactor', 'enrollTwoFactor');
    const user = await database.getUser(input.userId);
    if (!user) throw new Error(`enrollTwoFactor: unknown user id ${input.userId}`);
    const secret = generateTotpSecret();
    await database.updateUser({ id: user.id, twoFactorSecret: secret });
    return { secret };
  }

  async function verifyTwoFactorCode(input: { userId: string; code: string }) {
    requirePlugin('twoFactor', 'verifyTwoFactorCode');
    const user = await database.getUser(input.userId);
    if (!user || !user.twoFactorSecret) {
      throw new Error('verifyTwoFactorCode: user is not enrolled in 2FA');
    }
    return verifyTotpCode(user.twoFactorSecret, input.code);
  }

  async function validateSession(token: string) {
    return validateSessionByToken(database, token);
  }

  async function invalidateSession(token: string) {
    const session = await database.getSessionByToken(token);
    if (session) await database.deleteSession(session.id);
  }

  async function invalidateUserSessions(userId: string) {
    await invalidateSessionsForUser(database, userId);
  }

  async function createOrganization(input: {
    name: string;
    slug: string;
    userId: string;
  }) {
    requirePlugin('organizations', 'createOrganization');
    const owner = await database.getUser(input.userId);
    if (!owner) {
      throw new Error(`createOrganization: unknown user id ${input.userId}`);
    }
    const org = await database.createOrganization({
      name: input.name,
      slug: input.slug,
      createdBy: input.userId,
    });
    await database.addMembership({
      organizationId: org.id,
      userId: input.userId,
      role: 'owner',
    });
    return org;
  }

  async function inviteToOrganization(input: {
    organizationId: string;
    userId: string;
    role?: 'admin' | 'member';
  }) {
    requirePlugin('organizations', 'inviteToOrganization');
    const org = await database.getOrganization(input.organizationId);
    if (!org) {
      throw new Error(
        `inviteToOrganization: unknown organization id ${input.organizationId}`,
      );
    }
    const user = await database.getUser(input.userId);
    if (!user) {
      throw new Error(`inviteToOrganization: unknown user id ${input.userId}`);
    }
    return database.addMembership({
      organizationId: org.id,
      userId: input.userId,
      role: input.role ?? 'member',
    });
  }

  async function registerPasskey(input: {
    userId: string;
    credentialId: string;
    publicKey: string;
  }) {
    requirePlugin('passkey', 'registerPasskey');
    const user = await database.getUser(input.userId);
    if (!user) throw new Error(`registerPasskey: unknown user id ${input.userId}`);
    return database.registerPasskey({
      id: '',
      userId: input.userId,
      credentialId: input.credentialId,
      publicKey: input.publicKey,
    });
  }

  const env: BetterAuthTestEnv = {
    mode: 'mock',
    database,
    providers,
    plugins,
    sessionExpiration,
    verificationExpiration,
    signUpWithPassword,
    signInWithPassword,
    signInWithOAuth,
    sendMagicLink,
    consumeMagicLink,
    enrollTwoFactor,
    verifyTwoFactorCode,
    validateSession,
    invalidateSession,
    invalidateUserSessions,
    createOrganization,
    inviteToOrganization,
    registerPasskey,
    stop: async () => {
      database.reset();
    },
  };
  return env;
}

// Re-export the TOTP code helper so PoC / consumer tests can derive the current
// code without duplicating the RFC 6238 logic.
export { generateTotpCode };
