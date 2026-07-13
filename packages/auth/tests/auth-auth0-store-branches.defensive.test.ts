import { describe, expect, it } from 'vitest';
import { createAuth0Store } from '../src/auth0/store.js';
import type { Auth0User } from '../src/auth0/types.js';

function makeUser(overrides: Partial<Auth0User> = {}): Auth0User {
  return {
    user_id: 'auth0|user-1',
    email: 'a@example.com',
    email_verified: true,
    connection: 'Username-Password-Authentication',
    identities: [],
    created_at: new Date('2026-07-13'),
    updated_at: new Date('2026-07-13'),
    ...overrides,
  };
}

describe('auth0/store defensive branches', () => {
  it('createUser rejects duplicate email', () => {
    const store = createAuth0Store();
    store.createUser(makeUser({ user_id: 'u1', email: 'x@example.com' }));
    expect(() =>
      store.createUser(makeUser({ user_id: 'u2', email: 'x@example.com' })),
    ).toThrow(/user with email x@example.com already exists/);
  });

  it('updateUser throws when userId unknown', () => {
    const store = createAuth0Store();
    expect(() =>
      store.updateUser('unknown-user', { name: 'Alice' }),
    ).toThrow(/unknown user id unknown-user/);
  });

  it('updateUser reindexes when email changes', () => {
    const store = createAuth0Store();
    store.createUser(makeUser({ user_id: 'u1', email: 'old@example.com' }));
    const updated = store.updateUser('u1', { email: 'new@example.com' });
    expect(updated.email).toBe('new@example.com');
    expect(store.getUserByEmail('old@example.com')).toBeNull();
    expect(store.getUserByEmail('new@example.com')?.user_id).toBe('u1');
  });

  it('updateUser without email keeps existing index', () => {
    const store = createAuth0Store();
    store.createUser(makeUser({ user_id: 'u1', email: 'same@example.com' }));
    const updated = store.updateUser('u1', { name: 'Renamed' });
    expect(updated.name).toBe('Renamed');
    expect(store.getUserByEmail('same@example.com')?.user_id).toBe('u1');
  });

  it('deleteUser is a no-op when unknown', () => {
    const store = createAuth0Store();
    expect(() => store.deleteUser('unknown')).not.toThrow();
  });

  it('deleteUser removes user + email index', () => {
    const store = createAuth0Store();
    store.createUser(makeUser({ user_id: 'u1', email: 'a@example.com' }));
    store.deleteUser('u1');
    expect(store.getUser('u1')).toBeNull();
    expect(store.getUserByEmail('a@example.com')).toBeNull();
  });

  it('nextUserId increments counter per connection prefix', () => {
    const store = createAuth0Store();
    const id1 = store.nextUserId('Username-Password-Authentication');
    const id2 = store.nextUserId('Username-Password-Authentication');
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^auth0\|/);
    expect(id2).toMatch(/^auth0\|/);
  });

  it('nextUserId uses connection name for non-auth0 connections', () => {
    const store = createAuth0Store();
    const googleId = store.nextUserId('google-oauth2');
    expect(googleId).toMatch(/^google-oauth2\|/);
  });

  it('listUsers returns all users', () => {
    const store = createAuth0Store();
    store.createUser(makeUser({ user_id: 'u1', email: 'a@example.com' }));
    store.createUser(makeUser({ user_id: 'u2', email: 'b@example.com' }));
    expect(store.listUsers()).toHaveLength(2);
  });
});
