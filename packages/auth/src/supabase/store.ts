import type { SupabaseOAuthAuthorizationUrl, SupabaseOtpDelivery, SupabaseUser } from './types.js';

/** Internal session record — mirrors {@link SupabaseSession} but tracks refresh. */
export interface SupabaseSessionRecord {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  createdAt: Date;
  /** Set when the session is signed out or refreshed. */
  revokedAt: Date | undefined;
}

/**
 * In-memory Supabase Auth (GoTrue) state. Real Supabase hits the network on every
 * call; the mock replaces the network layer with a local Map-backed store that
 * produces the same shape. `reset()` is a test-only affordance that mirrors
 * dropping the mocked instance.
 */
export interface SupabaseStore {
  createUser(user: SupabaseUser, password: string | undefined): SupabaseUser;
  getUser(id: string): SupabaseUser | null;
  getUserByEmail(email: string): SupabaseUser | null;
  getUserByPhone(phone: string): SupabaseUser | null;
  updateUser(id: string, patch: Partial<SupabaseUser>): SupabaseUser;
  updatePassword(id: string, password: string): void;
  verifyPassword(id: string, password: string): boolean;
  deleteUser(id: string): void;
  listUsers(): SupabaseUser[];

  createSession(session: SupabaseSessionRecord): SupabaseSessionRecord;
  getSession(id: string): SupabaseSessionRecord | null;
  getSessionByAccessToken(accessToken: string): SupabaseSessionRecord | null;
  getSessionByRefreshToken(refreshToken: string): SupabaseSessionRecord | null;
  revokeSession(id: string): void;
  updateSession(id: string, patch: Partial<SupabaseSessionRecord>): SupabaseSessionRecord;

  recordOtp(delivery: SupabaseOtpDelivery): void;
  findPendingOtp(recipient: string, code: string): SupabaseOtpDelivery | null;
  markOtpConsumed(recipient: string, code: string): void;
  listOtpDeliveries(channel?: 'email' | 'sms'): SupabaseOtpDelivery[];

  recordOAuthPending(url: SupabaseOAuthAuthorizationUrl): void;
  consumeOAuthPending(code: string, codeVerifier: string): SupabaseOAuthAuthorizationUrl | null;
  listOAuthPending(): SupabaseOAuthAuthorizationUrl[];

  nextUserId(): string;
  nextIdentityId(): string;
  nextSessionId(): string;

  reset(): void;
}

export function createSupabaseStore(): SupabaseStore {
  const users = new Map<string, SupabaseUser>();
  const usersByEmail = new Map<string, SupabaseUser>();
  const usersByPhone = new Map<string, SupabaseUser>();
  const passwordsByUserId = new Map<string, string>();
  const sessions = new Map<string, SupabaseSessionRecord>();
  const sessionsByAccessToken = new Map<string, SupabaseSessionRecord>();
  const sessionsByRefreshToken = new Map<string, SupabaseSessionRecord>();
  const otpDeliveries: SupabaseOtpDelivery[] = [];
  const oauthPending: SupabaseOAuthAuthorizationUrl[] = [];

  let userCounter = 0;
  let identityCounter = 0;
  let sessionCounter = 0;

  return {
    createUser(user, password) {
      if (user.email && usersByEmail.has(user.email)) {
        throw new Error(`Supabase store: user with email ${user.email} already exists`);
      }
      if (user.phone && usersByPhone.has(user.phone)) {
        throw new Error(`Supabase store: user with phone ${user.phone} already exists`);
      }
      users.set(user.id, user);
      if (user.email) usersByEmail.set(user.email, user);
      if (user.phone) usersByPhone.set(user.phone, user);
      if (password !== undefined) passwordsByUserId.set(user.id, password);
      return user;
    },
    getUser(id) {
      return users.get(id) ?? null;
    },
    getUserByEmail(email) {
      return usersByEmail.get(email) ?? null;
    },
    getUserByPhone(phone) {
      return usersByPhone.get(phone) ?? null;
    },
    updateUser(id, patch) {
      const existing = users.get(id);
      if (!existing) throw new Error(`Supabase store: user ${id} not found`);
      // Reindex if email / phone changed.
      if (patch.email !== undefined && patch.email !== existing.email) {
        if (existing.email) usersByEmail.delete(existing.email);
        if (patch.email && usersByEmail.has(patch.email)) {
          throw new Error(`Supabase store: user with email ${patch.email} already exists`);
        }
        if (patch.email) usersByEmail.set(patch.email, { ...existing, ...patch });
      }
      if (patch.phone !== undefined && patch.phone !== existing.phone) {
        if (existing.phone) usersByPhone.delete(existing.phone);
        if (patch.phone && usersByPhone.has(patch.phone)) {
          throw new Error(`Supabase store: user with phone ${patch.phone} already exists`);
        }
        if (patch.phone) usersByPhone.set(patch.phone, { ...existing, ...patch });
      }
      const merged: SupabaseUser = { ...existing, ...patch, updatedAt: new Date() };
      users.set(id, merged);
      if (merged.email) usersByEmail.set(merged.email, merged);
      if (merged.phone) usersByPhone.set(merged.phone, merged);
      return merged;
    },
    updatePassword(id, password) {
      if (!users.has(id)) throw new Error(`Supabase store: user ${id} not found`);
      passwordsByUserId.set(id, password);
    },
    verifyPassword(id, password) {
      return passwordsByUserId.get(id) === password;
    },
    deleteUser(id) {
      const user = users.get(id);
      if (!user) return;
      users.delete(id);
      passwordsByUserId.delete(id);
      if (user.email) usersByEmail.delete(user.email);
      if (user.phone) usersByPhone.delete(user.phone);
    },
    listUsers() {
      return Array.from(users.values());
    },

    createSession(session) {
      sessions.set(session.id, session);
      sessionsByAccessToken.set(session.accessToken, session);
      sessionsByRefreshToken.set(session.refreshToken, session);
      return session;
    },
    getSession(id) {
      return sessions.get(id) ?? null;
    },
    getSessionByAccessToken(accessToken) {
      return sessionsByAccessToken.get(accessToken) ?? null;
    },
    getSessionByRefreshToken(refreshToken) {
      return sessionsByRefreshToken.get(refreshToken) ?? null;
    },
    revokeSession(id) {
      const session = sessions.get(id);
      if (!session) return;
      session.revokedAt = new Date();
      sessions.set(id, session);
    },
    updateSession(id, patch) {
      const existing = sessions.get(id);
      if (!existing) throw new Error(`Supabase store: session ${id} not found`);
      // Reindex if tokens rotate (refresh).
      if (patch.accessToken !== undefined && patch.accessToken !== existing.accessToken) {
        sessionsByAccessToken.delete(existing.accessToken);
        sessionsByAccessToken.set(patch.accessToken, { ...existing, ...patch });
      }
      if (patch.refreshToken !== undefined && patch.refreshToken !== existing.refreshToken) {
        sessionsByRefreshToken.delete(existing.refreshToken);
        sessionsByRefreshToken.set(patch.refreshToken, { ...existing, ...patch });
      }
      const merged = { ...existing, ...patch };
      sessions.set(id, merged);
      sessionsByAccessToken.set(merged.accessToken, merged);
      sessionsByRefreshToken.set(merged.refreshToken, merged);
      return merged;
    },

    recordOtp(delivery) {
      otpDeliveries.push(delivery);
    },
    findPendingOtp(recipient, code) {
      const found = otpDeliveries.find(
        (d) => d.recipient === recipient && d.code === code && !d.consumed,
      );
      return found ?? null;
    },
    markOtpConsumed(recipient, code) {
      const idx = otpDeliveries.findIndex(
        (d) => d.recipient === recipient && d.code === code && !d.consumed,
      );
      if (idx < 0) return;
      otpDeliveries[idx] = { ...otpDeliveries[idx]!, consumed: true };
    },
    listOtpDeliveries(channel) {
      if (channel === undefined) return [...otpDeliveries];
      return otpDeliveries.filter((d) => d.channel === channel);
    },

    recordOAuthPending(url) {
      oauthPending.push(url);
    },
    consumeOAuthPending(code, codeVerifier) {
      const idx = oauthPending.findIndex(
        (p) => p.code === code && p.codeVerifier === codeVerifier,
      );
      if (idx < 0) return null;
      const [consumed] = oauthPending.splice(idx, 1);
      return consumed ?? null;
    },
    listOAuthPending() {
      return [...oauthPending];
    },

    nextUserId() {
      userCounter += 1;
      return `user-${userCounter}`;
    },
    nextIdentityId() {
      identityCounter += 1;
      return `identity-${identityCounter}`;
    },
    nextSessionId() {
      sessionCounter += 1;
      return `session-${sessionCounter}`;
    },

    reset() {
      users.clear();
      usersByEmail.clear();
      usersByPhone.clear();
      passwordsByUserId.clear();
      sessions.clear();
      sessionsByAccessToken.clear();
      sessionsByRefreshToken.clear();
      otpDeliveries.length = 0;
      oauthPending.length = 0;
      userCounter = 0;
      identityCounter = 0;
      sessionCounter = 0;
    },
  };
}
