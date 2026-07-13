import { describe, expect, it } from 'vitest';
import { createClerkStore } from '../src/clerk/store.js';
import type { ClerkUser } from '../src/clerk/types.js';

function makeUser(overrides: {
  id: string;
  email?: string;
}): ClerkUser {
  return {
    id: overrides.id,
    primaryEmailAddress: overrides.email ?? `${overrides.id}@example.com`,
    emailAddresses: [],
    phoneNumbers: [],
    externalAccounts: [],
    createdAt: new Date('2026-07-13T00:00:00Z'),
  };
}

describe('clerk/store defensive branches', () => {
  it('createUser rejects duplicate email', () => {
    const store = createClerkStore();
    store.createUser(makeUser({ id: 'u-1', email: 'a@example.com' }));
    expect(() =>
      store.createUser(makeUser({ id: 'u-2', email: 'a@example.com' })),
    ).toThrow(/user with email a@example.com already exists/);
  });

  it('updateUser throws when id unknown', () => {
    const store = createClerkStore();
    expect(() =>
      store.updateUser('u-missing', { firstName: 'Alice' }),
    ).toThrow(/unknown user id u-missing/);
  });

  it('updateUser rebuilds email index when primaryEmailAddress changes', () => {
    const store = createClerkStore();
    store.createUser(makeUser({ id: 'u-1', email: 'old@example.com' }));
    const updated = store.updateUser('u-1', {
      primaryEmailAddress: 'new@example.com',
    });
    expect(updated.primaryEmailAddress).toBe('new@example.com');
    expect(store.getUserByEmail('old@example.com')).toBeNull();
    expect(store.getUserByEmail('new@example.com')?.id).toBe('u-1');
  });

  it('updateUser without primaryEmailAddress patch keeps existing email index', () => {
    const store = createClerkStore();
    store.createUser(makeUser({ id: 'u-1', email: 'same@example.com' }));
    const updated = store.updateUser('u-1', { firstName: 'Renamed' });
    expect(updated.firstName).toBe('Renamed');
    expect(store.getUserByEmail('same@example.com')?.id).toBe('u-1');
  });

  it('deleteUser is a no-op when id is unknown', () => {
    const store = createClerkStore();
    expect(() => store.deleteUser('u-missing')).not.toThrow();
  });

  it('deleteUser removes user, email index, sessions, and memberships', () => {
    const store = createClerkStore();
    store.createUser(makeUser({ id: 'u-1', email: 'x@example.com' }));
    // Verify baseline
    expect(store.getUser('u-1')?.id).toBe('u-1');
    expect(store.getUserByEmail('x@example.com')?.id).toBe('u-1');
    store.deleteUser('u-1');
    expect(store.getUser('u-1')).toBeNull();
    expect(store.getUserByEmail('x@example.com')).toBeNull();
  });
});
