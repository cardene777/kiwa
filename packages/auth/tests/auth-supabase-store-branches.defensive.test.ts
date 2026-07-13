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

describe('supabase/store defensive branches', () => {
  it('createUser without email/phone skips both index branches', () => {
    const store = createSupabaseStore();
    const created = store.createUser(makeUser({ id: 'u-1' }), undefined);
    expect(created.id).toBe('u-1');
    expect(store.getUserByEmail('anything@example.com')).toBeNull();
    expect(store.getUserByPhone('+1234567890')).toBeNull();
  });

  it('createUser rejects duplicate email', () => {
    const store = createSupabaseStore();
    store.createUser(
      makeUser({ id: 'u-1', email: 'a@example.com' }),
      undefined,
    );
    expect(() =>
      store.createUser(
        makeUser({ id: 'u-2', email: 'a@example.com' }),
        undefined,
      ),
    ).toThrow(/user with email a@example.com already exists/);
  });

  it('createUser rejects duplicate phone', () => {
    const store = createSupabaseStore();
    store.createUser(makeUser({ id: 'u-1', phone: '+1111' }), undefined);
    expect(() =>
      store.createUser(makeUser({ id: 'u-2', phone: '+1111' }), undefined),
    ).toThrow(/user with phone .* already exists/);
  });

  it('updateUser throws when id unknown', () => {
    const store = createSupabaseStore();
    expect(() =>
      store.updateUser('u-missing', { email: 'x@example.com' }),
    ).toThrow(/user u-missing not found/);
  });

  it('updateUser reindexes email when changed', () => {
    const store = createSupabaseStore();
    store.createUser(
      makeUser({ id: 'u-1', email: 'a@example.com' }),
      undefined,
    );
    const updated = store.updateUser('u-1', { email: 'b@example.com' });
    expect(updated.email).toBe('b@example.com');
    expect(store.getUserByEmail('a@example.com')).toBeNull();
    expect(store.getUserByEmail('b@example.com')?.id).toBe('u-1');
  });

  it('updateUser rejects when new email collides', () => {
    const store = createSupabaseStore();
    store.createUser(
      makeUser({ id: 'u-1', email: 'a@example.com' }),
      undefined,
    );
    store.createUser(
      makeUser({ id: 'u-2', email: 'b@example.com' }),
      undefined,
    );
    expect(() => store.updateUser('u-1', { email: 'b@example.com' })).toThrow(
      /user with email b@example.com already exists/,
    );
  });

  it('updateUser reindexes phone when changed', () => {
    const store = createSupabaseStore();
    store.createUser(makeUser({ id: 'u-1', phone: '+1111' }), undefined);
    const updated = store.updateUser('u-1', { phone: '+2222' });
    expect(updated.phone).toBe('+2222');
    expect(store.getUserByPhone('+1111')).toBeNull();
    expect(store.getUserByPhone('+2222')?.id).toBe('u-1');
  });

  it('updateUser rejects when new phone collides', () => {
    const store = createSupabaseStore();
    store.createUser(makeUser({ id: 'u-1', phone: '+1111' }), undefined);
    store.createUser(makeUser({ id: 'u-2', phone: '+2222' }), undefined);
    expect(() => store.updateUser('u-1', { phone: '+2222' })).toThrow(
      /user with phone .* already exists/,
    );
  });

  it('updatePassword throws when id unknown', () => {
    const store = createSupabaseStore();
    expect(() => store.updatePassword('u-missing', 'pw')).toThrow(
      /user u-missing not found/,
    );
  });

  it('verifyPassword returns false for unknown user', () => {
    const store = createSupabaseStore();
    expect(store.verifyPassword('u-nobody', 'pw')).toBe(false);
  });

  it('revokeSession is no-op when session id unknown', () => {
    const store = createSupabaseStore();
    expect(() => store.revokeSession('sess-missing')).not.toThrow();
  });
});
