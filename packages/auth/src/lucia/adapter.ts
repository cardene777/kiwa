import type {
  LuciaDatabaseAdapter,
  LuciaDatabaseKind,
  LuciaOAuthAccount,
  LuciaSession,
  LuciaUser,
} from './types.js';

let userCounter = 0;

function accountKey(provider: string, providerAccountId: string): string {
  return `${provider}:${providerAccountId}`;
}

/**
 * In-memory adapter that mirrors the shape of `@lucia-auth/adapter-sqlite` and
 * `@lucia-auth/adapter-postgresql`. Both expose the same method names, so this
 * single implementation stands in for either at test time — the `kind` tag is
 * the only observable difference.
 */
export function createInMemoryLuciaAdapter(
  kind: LuciaDatabaseKind = 'sqlite',
): LuciaDatabaseAdapter {
  const users = new Map<string, LuciaUser>();
  const usersByEmail = new Map<string, LuciaUser>();
  const sessions = new Map<string, LuciaSession>();
  const oauthAccounts = new Map<string, LuciaOAuthAccount>();

  return {
    kind,

    async createUser(input) {
      if (usersByEmail.has(input.email)) {
        throw new Error(`createUser: email already registered (${input.email})`);
      }
      userCounter += 1;
      const id = `user-${userCounter}`;
      const user: LuciaUser = { id, email: input.email };
      if (input.passwordHash !== undefined) user.passwordHash = input.passwordHash;
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
      const next: LuciaUser = { ...current, ...patch };
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
        if (session.userId === id) sessions.delete(sessionId);
      }
      for (const [key, account] of oauthAccounts) {
        if (account.userId === id) oauthAccounts.delete(key);
      }
    },

    async createSession(session) {
      sessions.set(session.id, session);
      return session;
    },

    async getSession(id) {
      return sessions.get(id) ?? null;
    },

    async updateSession(patch) {
      const current = sessions.get(patch.id);
      if (!current) return null;
      const next: LuciaSession = { ...current, ...patch };
      sessions.set(next.id, next);
      return next;
    },

    async deleteSession(id) {
      sessions.delete(id);
    },

    async deleteUserSessions(userId) {
      let removed = 0;
      for (const [id, session] of sessions) {
        if (session.userId === userId) {
          sessions.delete(id);
          removed += 1;
        }
      }
      return removed;
    },

    async deleteExpiredSessions() {
      const now = Date.now();
      let removed = 0;
      for (const [id, session] of sessions) {
        if (session.expiresAt.getTime() <= now) {
          sessions.delete(id);
          removed += 1;
        }
      }
      return removed;
    },

    async linkOAuthAccount(account) {
      oauthAccounts.set(accountKey(account.provider, account.providerAccountId), account);
      return account;
    },

    async getUserByOAuthAccount({ provider, providerAccountId }) {
      const account = oauthAccounts.get(accountKey(provider, providerAccountId));
      if (!account) return null;
      return users.get(account.userId) ?? null;
    },

    reset() {
      users.clear();
      usersByEmail.clear();
      sessions.clear();
      oauthAccounts.clear();
      userCounter = 0;
    },
  };
}

/** Test-only reset — restart the internal user id counter. */
export function __resetLuciaUserCounter(): void {
  userCounter = 0;
}
