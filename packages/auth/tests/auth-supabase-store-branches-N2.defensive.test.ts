import { describe, expect, it } from 'vitest';
import { createSupabaseStore } from '../src/supabase/store.js';
import type { SupabaseUser } from '../src/supabase/types.js';

const now = new Date('2026-07-13T00:00:00Z');

function makeUser(overrides: {
  id: string;
  email?: string | undefined;
  phone?: string | undefined;
}): SupabaseUser {
  return {
    id: overrides.id,
    email: overrides.email,
    phone: overrides.phone,
    emailConfirmedAt: undefined,
    phoneConfirmedAt: undefined,
    lastSignInAt: undefined,
    createdAt: now,
    updatedAt: now,
    metadata: {},
    appMetadata: {},
    aud: 'authenticated',
    role: 'authenticated',
    identities: [],
    userMetadata: {},
  } as SupabaseUser;
}

describe('supabase/store residual defensive branches', () => {
  it('createUser without password does not enable verifyPassword', () => {
    const store = createSupabaseStore();
    store.createUser(
      makeUser({ id: 'no-pw', email: 'nopw@example.com' }),
      undefined,
    );
    expect(store.verifyPassword('no-pw', 'anything')).toBe(false);
  });

  it('deleteUser cleans up email + phone + password indexes', () => {
    const store = createSupabaseStore();
    store.createUser(
      makeUser({
        id: 'both',
        email: 'both@example.com',
        phone: '+15551234567',
      }),
      'pass',
    );
    store.deleteUser('both');
    expect(store.getUserByEmail('both@example.com')).toBeNull();
    expect(store.getUserByPhone('+15551234567')).toBeNull();
    expect(store.verifyPassword('both', 'pass')).toBe(false);
  });

  it('deleteUser is idempotent for unknown id', () => {
    const store = createSupabaseStore();
    expect(() => store.deleteUser('unknown')).not.toThrow();
  });

  it('updateSession throws for unknown session id', () => {
    const store = createSupabaseStore();
    expect(() =>
      store.updateSession('miss', { accessToken: 'new' }),
    ).toThrow(/session miss not found/);
  });

  it('updateSession reindexes accessToken + refreshToken on rotation', () => {
    const store = createSupabaseStore();
    store.createUser(makeUser({ id: 'rot' }), undefined);
    store.createSession({
      id: 'sess-1',
      userId: 'rot',
      accessToken: 'a-old',
      refreshToken: 'r-old',
      expiresAt: Date.now() + 3600 * 1000,
      createdAt: new Date(),
      revokedAt: undefined,
    });
    store.updateSession('sess-1', {
      accessToken: 'a-new',
      refreshToken: 'r-new',
    });
    expect(store.getSessionByAccessToken('a-new')).not.toBeNull();
    expect(store.getSessionByAccessToken('a-old')).toBeNull();
    expect(store.getSessionByRefreshToken('r-new')).not.toBeNull();
    expect(store.getSessionByRefreshToken('r-old')).toBeNull();
  });

  it('markOtpConsumed is no-op when otp does not exist', () => {
    const store = createSupabaseStore();
    expect(() =>
      store.markOtpConsumed('none@example.com', '000000'),
    ).not.toThrow();
  });

  it('markOtpConsumed does nothing when code already consumed', () => {
    const store = createSupabaseStore();
    store.recordOtp({
      recipient: 'a@example.com',
      code: '111111',
      channel: 'email',
      magicLink: undefined,
      issuedAt: now,
      expiresAt: new Date(now.getTime() + 3600 * 1000),
      consumed: false,
    });
    store.markOtpConsumed('a@example.com', '111111');
    // Second call is a no-op.
    expect(() =>
      store.markOtpConsumed('a@example.com', '111111'),
    ).not.toThrow();
  });

  it('listOtpDeliveries with no channel returns all deliveries', () => {
    const store = createSupabaseStore();
    store.recordOtp({
      recipient: 'a@example.com',
      code: '111111',
      channel: 'email',
      magicLink: undefined,
      issuedAt: now,
      expiresAt: new Date(now.getTime() + 3600 * 1000),
      consumed: false,
    });
    store.recordOtp({
      recipient: '+15551234567',
      code: '222222',
      channel: 'sms',
      magicLink: undefined,
      issuedAt: now,
      expiresAt: new Date(now.getTime() + 3600 * 1000),
      consumed: false,
    });
    expect(store.listOtpDeliveries().length).toBe(2);
    expect(store.listOtpDeliveries('email').length).toBe(1);
    expect(store.listOtpDeliveries('sms').length).toBe(1);
  });

  it('consumeOAuthPending returns null when code + verifier do not match', () => {
    const store = createSupabaseStore();
    const result = store.consumeOAuthPending('bad-code', 'bad-verifier');
    expect(result).toBeNull();
  });
});
