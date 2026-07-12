import { describe, expect, it } from 'vitest';
import { createSupabaseStore } from '../src/supabase/store.js';
import type { SupabaseUser } from '../src/supabase/types.js';

function makeUser(id: string, email?: string, phone?: string): SupabaseUser {
  return {
    id,
    email: email ?? `${id}@example.com`,
    phone: phone ?? undefined,
    aud: 'authenticated',
    identities: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    emailConfirmedAt: null,
    phoneConfirmedAt: null,
    lastSignInAt: null,
    role: 'authenticated',
    userMetadata: {},
    appMetadata: {},
  } as unknown as SupabaseUser;
}

describe('supabase/store defensive branches', () => {
  it('createUser throws when email already exists', () => {
    const store = createSupabaseStore();
    store.createUser(makeUser('u1', 'dup@example.com'), 'pw');
    expect(() => store.createUser(makeUser('u2', 'dup@example.com'), 'pw')).toThrow(
      /already exists/,
    );
  });

  it('createUser throws when phone already exists', () => {
    const store = createSupabaseStore();
    store.createUser(makeUser('u1', undefined, '+81900000001'), 'pw');
    expect(() =>
      store.createUser(makeUser('u2', 'other@example.com', '+81900000001'), 'pw'),
    ).toThrow(/already exists/);
  });

  it('updateUser rejects patch that conflicts with existing email', () => {
    const store = createSupabaseStore();
    store.createUser(makeUser('u1', 'a@example.com'), 'pw');
    store.createUser(makeUser('u2', 'b@example.com'), 'pw');
    expect(() => store.updateUser('u2', { email: 'a@example.com' })).toThrow(/already exists/);
  });

  it('updateUser rejects patch that conflicts with existing phone', () => {
    const store = createSupabaseStore();
    store.createUser(makeUser('u1', 'a@example.com', '+81900000001'), 'pw');
    store.createUser(makeUser('u2', 'b@example.com', '+81900000002'), 'pw');
    expect(() => store.updateUser('u2', { phone: '+81900000001' })).toThrow(/already exists/);
  });

  it('updateUser allows email change to a fresh value', () => {
    const store = createSupabaseStore();
    store.createUser(makeUser('u1', 'a@example.com'), 'pw');
    const updated = store.updateUser('u1', { email: 'new@example.com' });
    expect(updated.email).toBe('new@example.com');
  });

  it('updateUser allows phone change to a fresh value', () => {
    const store = createSupabaseStore();
    store.createUser(makeUser('u1', 'a@example.com', '+81900000001'), 'pw');
    const updated = store.updateUser('u1', { phone: '+81900000002' });
    expect(updated.phone).toBe('+81900000002');
  });

  it('getUserByPhone returns null when phone not found', () => {
    const store = createSupabaseStore();
    expect(store.getUserByPhone('+81900000999')).toBeNull();
  });

  it('getUserByEmail returns user by email lookup', () => {
    const store = createSupabaseStore();
    store.createUser(makeUser('u1', 'lookup@example.com'), 'pw');
    const found = store.getUserByEmail('lookup@example.com');
    expect(found?.id).toBe('u1');
  });
});
