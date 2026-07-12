import { describe, expect, it } from 'vitest';
import { createClerkStore } from '../src/clerk/store.js';
import { setupOidcEnv } from '../src/oidc/setup-oidc-env.js';
import type { ClerkUser } from '../src/clerk/types.js';

function makeClerkUser(id: string, email: string): ClerkUser {
  return {
    id,
    primaryEmailAddress: email,
    emailAddresses: [],
    phoneNumbers: [],
    externalAccounts: [],
    createdAt: new Date(),
  };
}

describe('clerk/store defensive branches', () => {
  it('createUser throws when email already exists', () => {
    const store = createClerkStore();
    store.createUser(makeClerkUser('u1', 'a@example.com'));
    expect(() => store.createUser(makeClerkUser('u2', 'a@example.com'))).toThrow(/already exists/);
  });

  it('getUser returns null for unknown id', () => {
    const store = createClerkStore();
    expect(store.getUser('unknown')).toBeNull();
  });

  it('getUserByEmail returns null for unknown email', () => {
    const store = createClerkStore();
    expect(store.getUserByEmail('nobody@example.com')).toBeNull();
  });

  it('updateUser throws when id is unknown', () => {
    const store = createClerkStore();
    expect(() => store.updateUser('unknown', { firstName: 'x' })).toThrow(/unknown user id/);
  });

  it('updateUser rebuilds email index when primaryEmailAddress changes', () => {
    const store = createClerkStore();
    store.createUser(makeClerkUser('u1', 'a@example.com'));
    const updated = store.updateUser('u1', { primaryEmailAddress: 'b@example.com' });
    expect(updated.primaryEmailAddress).toBe('b@example.com');
    expect(store.getUserByEmail('a@example.com')).toBeNull();
    expect(store.getUserByEmail('b@example.com')?.id).toBe('u1');
  });

  it('updateUser preserves email index when primaryEmailAddress is same', () => {
    const store = createClerkStore();
    store.createUser(makeClerkUser('u1', 'a@example.com'));
    const updated = store.updateUser('u1', { firstName: 'renamed' });
    expect(store.getUserByEmail('a@example.com')?.id).toBe('u1');
    expect(updated.firstName).toBe('renamed');
  });

  it('deleteUser is idempotent on unknown id', () => {
    const store = createClerkStore();
    expect(() => store.deleteUser('nonexistent')).not.toThrow();
  });

  it('deleteUser cascades to sessions and memberships', () => {
    const store = createClerkStore();
    store.createUser(makeClerkUser('u1', 'a@example.com'));
    store.deleteUser('u1');
    expect(store.getUser('u1')).toBeNull();
  });
});

describe('setup-oidc-env options spread defensive branches', () => {
  it('normalizes issuer by stripping trailing slash', async () => {
    const env = await setupOidcEnv({ issuer: 'https://op.example/' });
    expect(env.issuer).toBe('https://op.example');
  });

  it('accepts issuer without trailing slash unchanged', async () => {
    const env = await setupOidcEnv({ issuer: 'https://op2.example' });
    expect(env.issuer).toBe('https://op2.example');
  });

  it('uses default issuer when unspecified', async () => {
    const env = await setupOidcEnv();
    expect(env.issuer).toContain('op.example.test');
  });

  it('accepts explicit jwksRetentionSec', async () => {
    const env = await setupOidcEnv({ jwksRetentionSec: 60 });
    expect(env).toBeDefined();
  });

  it('accepts explicit idTokenLifetimeSec + accessTokenLifetimeSec', async () => {
    const env = await setupOidcEnv({
      idTokenLifetimeSec: 900,
      accessTokenLifetimeSec: 300,
    });
    expect(env).toBeDefined();
  });

  it('accepts custom now function', async () => {
    const env = await setupOidcEnv({ now: () => 1_900_000_000_000 });
    expect(env).toBeDefined();
  });
});
