import type { TestEnvBase } from '@kiwa/core';

/**
 * Lucia v3 supports two database dialects out of the box through the official
 * adapter packages (`@lucia-auth/adapter-sqlite`, `@lucia-auth/adapter-postgresql`).
 * The kind tag lets the mock adapter behave the same as either at the API level
 * while still surfacing the dialect for tests that care about it.
 */
export type LuciaDatabaseKind = 'sqlite' | 'postgresql';

export type LuciaProviderKind = 'google' | 'github';

export interface LuciaUser {
  id: string;
  email: string;
  /** Argon2 hash returned by the password helper — never stored in plain text. */
  passwordHash?: string | undefined;
}

export interface LuciaSession {
  id: string;
  userId: string;
  expiresAt: Date;
  /**
   * Lucia v3 sessions expose a `fresh` flag that flips to true when the session
   * was just extended (rolling expiration). The mock mirrors the same shape.
   */
  fresh: boolean;
}

export interface LuciaOAuthAccount {
  userId: string;
  provider: LuciaProviderKind;
  providerAccountId: string;
}

export interface LuciaOAuthProfile {
  provider: LuciaProviderKind;
  providerAccountId: string;
  email: string;
}

/**
 * Minimal, Lucia-v3-compatible database adapter surface. `@lucia-auth/adapter-sqlite`
 * and `@lucia-auth/adapter-postgresql` both expose the same method names, so the
 * mock is a drop-in for either at test time.
 */
export interface LuciaDatabaseAdapter {
  kind: LuciaDatabaseKind;
  createUser: (user: Omit<LuciaUser, 'id'>) => Promise<LuciaUser>;
  getUser: (id: string) => Promise<LuciaUser | null>;
  getUserByEmail: (email: string) => Promise<LuciaUser | null>;
  updateUser: (user: Partial<LuciaUser> & { id: string }) => Promise<LuciaUser>;
  deleteUser: (id: string) => Promise<void>;
  createSession: (session: LuciaSession) => Promise<LuciaSession>;
  getSession: (id: string) => Promise<LuciaSession | null>;
  updateSession: (
    session: Partial<LuciaSession> & { id: string },
  ) => Promise<LuciaSession | null>;
  deleteSession: (id: string) => Promise<void>;
  /** Bulk-delete every session belonging to a user — matches Lucia's `deleteUserSessions(userId)`. */
  deleteUserSessions: (userId: string) => Promise<number>;
  deleteExpiredSessions: () => Promise<number>;
  linkOAuthAccount: (account: LuciaOAuthAccount) => Promise<LuciaOAuthAccount>;
  getUserByOAuthAccount: (input: {
    provider: LuciaProviderKind;
    providerAccountId: string;
  }) => Promise<LuciaUser | null>;
  /** Test-only affordance not present in the real adapters. */
  reset: () => void;
}

export interface LuciaProviderMock {
  kind: LuciaProviderKind;
  id: string;
  name: string;
  signIn: (input?: { email?: string; sub?: string }) => Promise<LuciaOAuthProfile>;
}

export interface SetupLuciaEnvOptions {
  /**
   * Which OAuth provider mocks to expose. Defaults to `['google', 'github']`.
   * Password auth is always available and does not need to be enumerated here.
   */
  providers?: LuciaProviderKind[] | undefined;
  /** Session lifetime in seconds. Defaults to 30 days, matching Lucia's default. */
  sessionExpiration?: number | undefined;
  /**
   * Pre-built adapter instance. When omitted, the helper builds an in-memory
   * adapter of the requested {@link database.kind} (default `sqlite`).
   */
  database?: LuciaDatabaseAdapter | { kind?: LuciaDatabaseKind } | undefined;
}

export interface LuciaTestEnv extends TestEnvBase<'mock'> {
  database: LuciaDatabaseAdapter;
  providers: Record<LuciaProviderKind, LuciaProviderMock>;
  sessionExpiration: number;
  /** Register a new email + password user. Rejects when the email already exists. */
  signUpWithPassword: (input: { email: string; password: string }) => Promise<{
    user: LuciaUser;
    session: LuciaSession;
  }>;
  /** Verify the password and issue a fresh session. Rejects on unknown user / bad password. */
  signInWithPassword: (input: { email: string; password: string }) => Promise<{
    user: LuciaUser;
    session: LuciaSession;
  }>;
  /** Simulate the OAuth callback for the given provider and issue a session. */
  signInWithOAuth: (
    provider: LuciaProviderKind,
    input?: { email?: string; sub?: string },
  ) => Promise<{ user: LuciaUser; session: LuciaSession }>;
  /**
   * Validate a session id. Mirrors Lucia's `validateSession()` — returns null
   * when the session is missing / expired, and re-issues a fresh session when
   * the current one is inside its rolling refresh window.
   */
  validateSession: (
    sessionId: string,
  ) => Promise<{ user: LuciaUser; session: LuciaSession } | null>;
  /** Invalidate a single session — mirrors Lucia's `invalidateSession()`. */
  invalidateSession: (sessionId: string) => Promise<void>;
  /** Invalidate every session belonging to the user — mirrors `invalidateUserSessions()`. */
  invalidateUserSessions: (userId: string) => Promise<void>;
}
