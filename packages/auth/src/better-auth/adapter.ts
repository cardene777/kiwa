import type {
  BetterAuthAccount,
  BetterAuthDatabaseAdapter,
  BetterAuthDatabaseKind,
  BetterAuthMembership,
  BetterAuthOrganization,
  BetterAuthPasskey,
  BetterAuthSession,
  BetterAuthUser,
  BetterAuthVerification,
} from './types.js';

let userCounter = 0;
let orgCounter = 0;
let passkeyCounter = 0;

function accountKey(provider: string, providerAccountId: string): string {
  return `${provider}:${providerAccountId}`;
}

function membershipKey(orgId: string, userId: string): string {
  return `${orgId}:${userId}`;
}

/**
 * In-memory adapter that mirrors Better Auth's Prisma / Drizzle / Kysely adapter
 * surface. All three official adapters expose the same operation set at the Better
 * Auth layer (create / find / update / delete + a small verification + account
 * surface), so this single implementation stands in for any of them — the `kind`
 * tag is the only observable difference.
 */
export function createInMemoryBetterAuthAdapter(
  kind: BetterAuthDatabaseKind = 'prisma',
): BetterAuthDatabaseAdapter {
  const users = new Map<string, BetterAuthUser>();
  const usersByEmail = new Map<string, BetterAuthUser>();
  const sessions = new Map<string, BetterAuthSession>();
  const sessionsByToken = new Map<string, BetterAuthSession>();
  const accounts = new Map<string, BetterAuthAccount>();
  const verifications = new Map<string, BetterAuthVerification>();
  const organizations = new Map<string, BetterAuthOrganization>();
  const memberships = new Map<string, BetterAuthMembership>();
  const passkeys = new Map<string, BetterAuthPasskey>();

  function verificationKey(identifier: string, value: string): string {
    return `${identifier}::${value}`;
  }

  return {
    kind,

    async createUser(input) {
      if (usersByEmail.has(input.email)) {
        throw new Error(`createUser: email already registered (${input.email})`);
      }
      userCounter += 1;
      const id = `user-${userCounter}`;
      const user: BetterAuthUser = {
        id,
        email: input.email,
        emailVerified: input.emailVerified ?? false,
      };
      if (input.passwordHash !== undefined) user.passwordHash = input.passwordHash;
      if (input.twoFactorSecret !== undefined) user.twoFactorSecret = input.twoFactorSecret;
      users.set(id, user);
      usersByEmail.set(input.email, user);
      return user;
    },

    async getUser(id) {
      return users.get(id) ?? null;
    },

    async getUserByEmail(email) {
      return usersByEmail.get(email) ?? null;
    },

    async updateUser(patch) {
      const current = users.get(patch.id);
      if (!current) throw new Error(`updateUser: unknown id ${patch.id}`);
      if (patch.email !== undefined && patch.email !== current.email) {
        usersByEmail.delete(current.email);
      }
      const next: BetterAuthUser = { ...current, ...patch };
      users.set(next.id, next);
      usersByEmail.set(next.email, next);
      return next;
    },

    async deleteUser(id) {
      const user = users.get(id);
      if (!user) return;
      users.delete(id);
      usersByEmail.delete(user.email);
      for (const [sessionId, session] of sessions) {
        if (session.userId === id) {
          sessions.delete(sessionId);
          sessionsByToken.delete(session.token);
        }
      }
      for (const [key, account] of accounts) {
        if (account.userId === id) accounts.delete(key);
      }
      for (const [key, membership] of memberships) {
        if (membership.userId === id) memberships.delete(key);
      }
      for (const [key, passkey] of passkeys) {
        if (passkey.userId === id) passkeys.delete(key);
      }
    },

    async createSession(session) {
      sessions.set(session.id, session);
      sessionsByToken.set(session.token, session);
      return session;
    },

    async getSession(id) {
      return sessions.get(id) ?? null;
    },

    async getSessionByToken(token) {
      return sessionsByToken.get(token) ?? null;
    },

    async deleteSession(id) {
      const session = sessions.get(id);
      if (!session) return;
      sessions.delete(id);
      sessionsByToken.delete(session.token);
    },

    async deleteUserSessions(userId) {
      let removed = 0;
      for (const [id, session] of sessions) {
        if (session.userId === userId) {
          sessions.delete(id);
          sessionsByToken.delete(session.token);
          removed += 1;
        }
      }
      return removed;
    },

    async linkAccount(account) {
      accounts.set(accountKey(account.provider, account.providerAccountId), account);
      return account;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const account = accounts.get(accountKey(provider, providerAccountId));
      if (!account) return null;
      return users.get(account.userId) ?? null;
    },

    async createVerification(verification) {
      verifications.set(
        verificationKey(verification.identifier, verification.value),
        verification,
      );
      return verification;
    },

    async consumeVerification(identifier, value) {
      const key = verificationKey(identifier, value);
      const verification = verifications.get(key);
      if (!verification) return null;
      verifications.delete(key);
      if (verification.expiresAt.getTime() <= Date.now()) return null;
      return verification;
    },

    async createOrganization(input) {
      orgCounter += 1;
      const org: BetterAuthOrganization = { id: `org-${orgCounter}`, ...input };
      organizations.set(org.id, org);
      return org;
    },

    async getOrganization(id) {
      return organizations.get(id) ?? null;
    },

    async addMembership(membership) {
      memberships.set(membershipKey(membership.organizationId, membership.userId), membership);
      return membership;
    },

    async getMemberships(userId) {
      const out: BetterAuthMembership[] = [];
      for (const membership of memberships.values()) {
        if (membership.userId === userId) out.push(membership);
      }
      return out;
    },

    async registerPasskey(passkey) {
      passkeyCounter += 1;
      const stored: BetterAuthPasskey = { ...passkey, id: passkey.id || `passkey-${passkeyCounter}` };
      passkeys.set(stored.id, stored);
      return stored;
    },

    async getPasskeysForUser(userId) {
      const out: BetterAuthPasskey[] = [];
      for (const passkey of passkeys.values()) {
        if (passkey.userId === userId) out.push(passkey);
      }
      return out;
    },

    reset() {
      users.clear();
      usersByEmail.clear();
      sessions.clear();
      sessionsByToken.clear();
      accounts.clear();
      verifications.clear();
      organizations.clear();
      memberships.clear();
      passkeys.clear();
      userCounter = 0;
      orgCounter = 0;
      passkeyCounter = 0;
    },
  };
}

/** Test-only reset for the internal id counters. */
export function __resetBetterAuthCounters(): void {
  userCounter = 0;
  orgCounter = 0;
  passkeyCounter = 0;
}
