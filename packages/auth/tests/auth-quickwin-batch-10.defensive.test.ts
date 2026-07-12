import { describe, expect, it } from 'vitest';
import { createAuth0Store } from '../src/auth0/store.js';
import { setupNextAuthEnv } from '../src/setup-nextauth-env.js';
import type { Auth0User } from '../src/auth0/types.js';

function makeAuth0User(id: string, email: string): Auth0User {
  return {
    user_id: id,
    email,
    email_verified: true,
    name: 'Test',
    nickname: 'test',
    picture: 'https://example.com/pic.png',
    identities: [],
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as unknown as Auth0User;
}

describe('auth0/store defensive branches', () => {
  it('createUser throws when email already exists', () => {
    const store = createAuth0Store();
    store.createUser(makeAuth0User('auth0|1', 'a@example.com'));
    expect(() => store.createUser(makeAuth0User('auth0|2', 'a@example.com'))).toThrow(
      /already exists/,
    );
  });

  it('getUser returns null for unknown user_id', () => {
    const store = createAuth0Store();
    expect(store.getUser('unknown|999')).toBeNull();
  });

  it('getUserByEmail returns null for unknown email', () => {
    const store = createAuth0Store();
    expect(store.getUserByEmail('nobody@example.com')).toBeNull();
  });
});

describe('setup-nextauth-env defensive branches', () => {
  it('throws when unknown session strategy is given', async () => {
    await expect(
      setupNextAuthEnv({ session: { strategy: 'unknown' as never } }),
    ).rejects.toThrow(/unknown session strategy/);
  });

  it('throws when providers array is empty', async () => {
    await expect(setupNextAuthEnv({ providers: [] })).rejects.toThrow(
      /providers must contain at least one entry/,
    );
  });

  it('signIn throws when provider was not configured', async () => {
    const env = await setupNextAuthEnv({ providers: ['google'] });
    await expect(env.signIn('github' as never)).rejects.toThrow(/was not configured/);
  });

  it('getSession returns null for unknown JWT sessionToken (invalid format)', async () => {
    const env = await setupNextAuthEnv({ providers: ['google'] });
    const session = await env.getSession('not-a-valid-token');
    expect(session).toBeNull();
  });

  it('signOut on database strategy delegates to database.deleteSession', async () => {
    const env = await setupNextAuthEnv({
      providers: ['google'],
      session: { strategy: 'database' },
    });
    const signInResult = await env.signIn('google');
    await env.signOut(signInResult.session.sessionToken);
    const after = await env.getSession(signInResult.session.sessionToken);
    expect(after).toBeNull();
  });
});

