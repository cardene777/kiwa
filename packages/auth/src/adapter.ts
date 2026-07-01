import type {
  AuthAccount,
  AuthDatabaseAdapter,
  AuthSession,
  AuthUser,
  VerificationToken,
} from './types.js';

let userCounter = 0;

function accountKey(provider: string, providerAccountId: string): string {
  return `${provider}:${providerAccountId}`;
}

/**
 * In-memory database adapter compatible with the Auth.js adapter contract.
 *
 * `@auth/prisma-adapter` and `@auth/drizzle-adapter` both expose the same
 * method names, so this mock is a drop-in for either surface during tests.
 */
export function createInMemoryAdapter(): AuthDatabaseAdapter {
  const users = new Map<string, AuthUser>();
  const usersByEmail = new Map<string, AuthUser>();
  const accounts = new Map<string, AuthAccount>();
  const sessions = new Map<string, AuthSession>();
  const verificationTokens = new Map<string, VerificationToken>();

  return {
    async createUser(input) {
      userCounter += 1;
      const id = `user-${userCounter}`;
      const user: AuthUser = { id, email: input.email };
      if (input.name !== undefined) user.name = input.name;
      if (input.emailVerified !== undefined) user.emailVerified = input.emailVerified;
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

    async getUserByAccount({ provider, providerAccountId }) {
      const account = accounts.get(accountKey(provider, providerAccountId));
      if (!account) return null;
      return users.get(account.userId) ?? null;
    },

    async updateUser(patch) {
      const current = users.get(patch.id);
      if (!current) throw new Error(`updateUser: unknown id ${patch.id}`);
      if (patch.email !== undefined && patch.email !== current.email) {
        usersByEmail.delete(current.email);
      }
      const next: AuthUser = { ...current, ...patch };
      users.set(next.id, next);
      usersByEmail.set(next.email, next);
      return next;
    },

    async deleteUser(id) {
      const user = users.get(id);
      if (!user) return;
      users.delete(id);
      usersByEmail.delete(user.email);
      for (const [key, account] of accounts) {
        if (account.userId === id) accounts.delete(key);
      }
      for (const [token, session] of sessions) {
        if (session.userId === id) sessions.delete(token);
      }
    },

    async linkAccount(account) {
      accounts.set(accountKey(account.provider, account.providerAccountId), account);
      return account;
    },

    async unlinkAccount({ provider, providerAccountId }) {
      accounts.delete(accountKey(provider, providerAccountId));
    },

    async createSession(session) {
      sessions.set(session.sessionToken, session);
      return session;
    },

    async getSessionAndUser(sessionToken) {
      const session = sessions.get(sessionToken);
      if (!session) return null;
      const user = users.get(session.userId);
      if (!user) return null;
      return { session, user };
    },

    async updateSession(patch) {
      const current = sessions.get(patch.sessionToken);
      if (!current) return null;
      const next: AuthSession = { ...current, ...patch };
      sessions.set(next.sessionToken, next);
      return next;
    },

    async deleteSession(sessionToken) {
      sessions.delete(sessionToken);
    },

    async createVerificationToken(token) {
      verificationTokens.set(`${token.identifier}:${token.token}`, token);
      return token;
    },

    async useVerificationToken({ identifier, token }) {
      const key = `${identifier}:${token}`;
      const value = verificationTokens.get(key);
      if (!value) return null;
      verificationTokens.delete(key);
      return value;
    },

    reset() {
      users.clear();
      usersByEmail.clear();
      accounts.clear();
      sessions.clear();
      verificationTokens.clear();
      userCounter = 0;
    },
  };
}
