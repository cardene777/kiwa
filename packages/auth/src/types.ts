import type { TestEnvBase } from '@kiwa/core';

export type SessionStrategy = 'jwt' | 'database';

export type ProviderKind = 'google' | 'github' | 'email';

export interface ProviderMock {
  kind: ProviderKind;
  id: string;
  name: string;
  /** Simulate a successful sign-in. Returns the profile the provider would return. */
  signIn: (input?: { email?: string; sub?: string; name?: string }) => Promise<AuthProfile>;
}

export interface AuthProfile {
  provider: ProviderKind;
  providerAccountId: string;
  email: string;
  name?: string | undefined;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string | undefined;
  emailVerified?: Date | undefined;
}

export interface AuthAccount {
  userId: string;
  provider: ProviderKind;
  providerAccountId: string;
  type: 'oauth' | 'email';
}

export interface AuthSession {
  sessionToken: string;
  userId: string;
  expires: Date;
}

export interface VerificationToken {
  identifier: string;
  token: string;
  expires: Date;
}

/**
 * Minimal, Auth.js-compatible database adapter surface.
 *
 * Both Prisma (`@auth/prisma-adapter`) and Drizzle (`@auth/drizzle-adapter`)
 * expose the same method names, so the mock can stand in for either.
 */
export interface AuthDatabaseAdapter {
  createUser: (user: Omit<AuthUser, 'id'>) => Promise<AuthUser>;
  getUser: (id: string) => Promise<AuthUser | null>;
  getUserByEmail: (email: string) => Promise<AuthUser | null>;
  getUserByAccount: (input: { provider: ProviderKind; providerAccountId: string }) => Promise<AuthUser | null>;
  updateUser: (user: Partial<AuthUser> & { id: string }) => Promise<AuthUser>;
  deleteUser: (id: string) => Promise<void>;
  linkAccount: (account: AuthAccount) => Promise<AuthAccount>;
  unlinkAccount: (input: { provider: ProviderKind; providerAccountId: string }) => Promise<void>;
  createSession: (session: AuthSession) => Promise<AuthSession>;
  getSessionAndUser: (sessionToken: string) => Promise<{ session: AuthSession; user: AuthUser } | null>;
  updateSession: (session: Partial<AuthSession> & { sessionToken: string }) => Promise<AuthSession | null>;
  deleteSession: (sessionToken: string) => Promise<void>;
  createVerificationToken: (token: VerificationToken) => Promise<VerificationToken>;
  useVerificationToken: (input: { identifier: string; token: string }) => Promise<VerificationToken | null>;
  /** Reset all in-memory tables. Test-only affordance not present in real adapters. */
  reset: () => void;
}

export interface SetupNextAuthEnvOptions {
  providers?: ProviderKind[] | undefined;
  session?: { strategy?: SessionStrategy; maxAge?: number } | undefined;
  database?: AuthDatabaseAdapter | undefined;
}

export interface NextAuthTestEnv extends TestEnvBase<'mock'> {
  session: { strategy: SessionStrategy; maxAge: number };
  providers: Record<ProviderKind, ProviderMock>;
  database: AuthDatabaseAdapter;
  /**
   * Simulate the full sign-in flow through the given provider. Returns the
   * session that a real NextAuth callback would produce.
   */
  signIn: (
    provider: ProviderKind,
    input?: { email?: string; sub?: string; name?: string },
  ) => Promise<{
    user: AuthUser;
    session: { sessionToken: string; expires: Date };
    strategy: SessionStrategy;
  }>;
  /** Retrieve the session for a token — mirrors `auth()` / `getServerSession()`. */
  getSession: (sessionToken: string) => Promise<{ user: AuthUser; expires: Date } | null>;
  /** Sign the user out — mirrors NextAuth's `signOut()`. */
  signOut: (sessionToken: string) => Promise<void>;
}
