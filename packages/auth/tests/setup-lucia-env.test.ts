import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createInMemoryLuciaAdapter,
  generateSessionId,
  hashPassword,
  setupLuciaEnv,
  verifyPassword,
  type LuciaTestEnv,
} from '../src/index.js';
import { __resetLuciaUserCounter } from '../src/lucia/adapter.js';
import { __resetLuciaProviderCounter } from '../src/lucia/providers.js';

const envs: LuciaTestEnv[] = [];

beforeEach(() => {
  __resetLuciaProviderCounter();
  __resetLuciaUserCounter();
});

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('setupLuciaEnv (defaults)', () => {
  it('exposes google and github oauth mocks', async () => {
    const env = await setupLuciaEnv();
    envs.push(env);
    expect(env.providers.google.id).toBe('google');
    expect(env.providers.github.id).toBe('github');
  });

  it('defaults to the sqlite adapter kind', async () => {
    const env = await setupLuciaEnv();
    envs.push(env);
    expect(env.database.kind).toBe('sqlite');
  });

  it('honours a postgresql database.kind hint when building the default adapter', async () => {
    const env = await setupLuciaEnv({ database: { kind: 'postgresql' } });
    envs.push(env);
    expect(env.database.kind).toBe('postgresql');
  });

  it('rejects a non-positive sessionExpiration', async () => {
    await expect(setupLuciaEnv({ sessionExpiration: 0 })).rejects.toThrow(/sessionExpiration/);
    await expect(setupLuciaEnv({ sessionExpiration: -1 })).rejects.toThrow(/sessionExpiration/);
  });

  it('rejects an empty providers list', async () => {
    await expect(setupLuciaEnv({ providers: [] })).rejects.toThrow(/providers/);
  });
});

describe('setupLuciaEnv (password auth)', () => {
  it('signUpWithPassword creates a user + session and refuses duplicate emails', async () => {
    const env = await setupLuciaEnv();
    envs.push(env);
    const first = await env.signUpWithPassword({
      email: 'alice@example.test',
      password: 'correct-horse-battery-staple',
    });
    expect(first.user.email).toBe('alice@example.test');
    expect(first.user.passwordHash).toMatch(/^\$argon2id-mock\$/);
    expect(first.session.id).toHaveLength(40);
    expect(first.session.fresh).toBe(true);

    await expect(
      env.signUpWithPassword({
        email: 'alice@example.test',
        password: 'another-one',
      }),
    ).rejects.toThrow(/already registered/);
  });

  it('signInWithPassword issues a fresh session on the correct password', async () => {
    const env = await setupLuciaEnv();
    envs.push(env);
    await env.signUpWithPassword({ email: 'bob@example.test', password: 'hunter2' });
    const signed = await env.signInWithPassword({
      email: 'bob@example.test',
      password: 'hunter2',
    });
    expect(signed.user.email).toBe('bob@example.test');
    expect(signed.session.userId).toBe(signed.user.id);
  });

  it('signInWithPassword rejects a wrong password with a generic error', async () => {
    const env = await setupLuciaEnv();
    envs.push(env);
    await env.signUpWithPassword({ email: 'c@example.test', password: 'correct' });
    await expect(
      env.signInWithPassword({ email: 'c@example.test', password: 'wrong' }),
    ).rejects.toThrow(/invalid email or password/);
  });

  it('signInWithPassword rejects an unknown email with the same generic error', async () => {
    const env = await setupLuciaEnv();
    envs.push(env);
    await expect(
      env.signInWithPassword({ email: 'nobody@example.test', password: 'x' }),
    ).rejects.toThrow(/invalid email or password/);
  });

  it('hashPassword refuses empty passwords', async () => {
    await expect(hashPassword('')).rejects.toThrow(/empty/);
  });

  it('verifyPassword returns false for a malformed hash instead of throwing', async () => {
    expect(await verifyPassword('not-a-valid-hash', 'x')).toBe(false);
  });
});

describe('setupLuciaEnv (oauth)', () => {
  it('signInWithOAuth(google) creates a user on first sign-in and reuses it on the next', async () => {
    const env = await setupLuciaEnv();
    envs.push(env);
    const first = await env.signInWithOAuth('google', {
      sub: 'g-1',
      email: 'dave@example.test',
    });
    const second = await env.signInWithOAuth('google', {
      sub: 'g-1',
      email: 'dave@example.test',
    });
    expect(second.user.id).toBe(first.user.id);
    // Two distinct sessions issued, no user duplication.
    expect(second.session.id).not.toBe(first.session.id);
  });

  it('signInWithOAuth on github reuses a user that already signed up via password on the same email', async () => {
    const env = await setupLuciaEnv();
    envs.push(env);
    const pwd = await env.signUpWithPassword({
      email: 'eve@example.test',
      password: 'x1234567',
    });
    const oauth = await env.signInWithOAuth('github', {
      sub: 'gh-9',
      email: 'eve@example.test',
    });
    expect(oauth.user.id).toBe(pwd.user.id);
  });

  it('signInWithOAuth rejects an unconfigured provider', async () => {
    const env = await setupLuciaEnv({ providers: ['google'] });
    envs.push(env);
    await expect(env.signInWithOAuth('github')).rejects.toThrow(/github/);
  });
});

describe('setupLuciaEnv (session lifecycle)', () => {
  it('validateSession returns the user for a fresh session and marks it non-fresh', async () => {
    const env = await setupLuciaEnv();
    envs.push(env);
    const signed = await env.signUpWithPassword({
      email: 'f@example.test',
      password: 'p',
    });
    const validated = await env.validateSession(signed.session.id);
    expect(validated?.user.id).toBe(signed.user.id);
    expect(validated?.session.fresh).toBe(false);
  });

  it('validateSession extends a session inside the rolling refresh window', async () => {
    const env = await setupLuciaEnv({ sessionExpiration: 100 });
    envs.push(env);
    const signed = await env.signUpWithPassword({
      email: 'g@example.test',
      password: 'p',
    });
    // Push the persisted expiry to less than half the lifetime remaining so the
    // validator flips into the refresh branch without wall-clock sleeps.
    await env.database.updateSession({
      id: signed.session.id,
      expiresAt: new Date(Date.now() + 10 * 1000),
    });
    const validated = await env.validateSession(signed.session.id);
    expect(validated?.session.fresh).toBe(true);
    const remainingMs = validated!.session.expiresAt.getTime() - Date.now();
    expect(remainingMs).toBeGreaterThan(90 * 1000);
  });

  it('validateSession returns null and evicts an expired session', async () => {
    const env = await setupLuciaEnv({ sessionExpiration: 60 });
    envs.push(env);
    const signed = await env.signUpWithPassword({
      email: 'h@example.test',
      password: 'p',
    });
    await env.database.updateSession({
      id: signed.session.id,
      expiresAt: new Date(Date.now() - 1000),
    });
    const validated = await env.validateSession(signed.session.id);
    expect(validated).toBeNull();
    expect(await env.database.getSession(signed.session.id)).toBeNull();
  });

  it('validateSession returns null for an unknown id', async () => {
    const env = await setupLuciaEnv();
    envs.push(env);
    expect(await env.validateSession('not-a-session')).toBeNull();
  });

  it('invalidateSession clears a single session', async () => {
    const env = await setupLuciaEnv();
    envs.push(env);
    const signed = await env.signUpWithPassword({ email: 'i@example.test', password: 'p' });
    await env.invalidateSession(signed.session.id);
    expect(await env.validateSession(signed.session.id)).toBeNull();
  });

  it('invalidateUserSessions clears every session belonging to a user', async () => {
    const env = await setupLuciaEnv();
    envs.push(env);
    const signed = await env.signUpWithPassword({ email: 'j@example.test', password: 'p' });
    const second = await env.signInWithPassword({ email: 'j@example.test', password: 'p' });
    await env.invalidateUserSessions(signed.user.id);
    expect(await env.validateSession(signed.session.id)).toBeNull();
    expect(await env.validateSession(second.session.id)).toBeNull();
  });

  it('deleteUserSessions returns the count of removed rows and leaves other users untouched', async () => {
    const env = await setupLuciaEnv();
    envs.push(env);
    const alice = await env.signUpWithPassword({ email: 'alice@ex.test', password: 'p' });
    await env.signInWithPassword({ email: 'alice@ex.test', password: 'p' });
    const bob = await env.signUpWithPassword({ email: 'bob@ex.test', password: 'p' });
    const removed = await env.database.deleteUserSessions(alice.user.id);
    expect(removed).toBe(2);
    expect(await env.database.getSession(bob.session.id)).not.toBeNull();
  });

  it('deleteExpiredSessions removes only expired rows and returns the count', async () => {
    const env = await setupLuciaEnv({ sessionExpiration: 60 });
    envs.push(env);
    const stale = await env.signUpWithPassword({ email: 'k@example.test', password: 'p' });
    const fresh = await env.signInWithPassword({ email: 'k@example.test', password: 'p' });
    await env.database.updateSession({
      id: stale.session.id,
      expiresAt: new Date(Date.now() - 1000),
    });
    const removed = await env.database.deleteExpiredSessions();
    expect(removed).toBe(1);
    expect(await env.database.getSession(stale.session.id)).toBeNull();
    expect(await env.database.getSession(fresh.session.id)).not.toBeNull();
  });

  it('generateSessionId emits a 40-char url-safe string', () => {
    const id = generateSessionId();
    expect(id).toMatch(/^[a-z0-9]{40}$/);
  });
});

describe('setupLuciaEnv (adapter compat)', () => {
  it('external sqlite-shaped adapter can be injected', async () => {
    const external = createInMemoryLuciaAdapter('sqlite');
    const env = await setupLuciaEnv({ database: external });
    envs.push(env);
    await env.signUpWithPassword({ email: 'l@example.test', password: 'p' });
    expect(await external.getUserByEmail('l@example.test')).not.toBeNull();
  });

  it('external postgresql-shaped adapter can be injected', async () => {
    const external = createInMemoryLuciaAdapter('postgresql');
    const env = await setupLuciaEnv({ database: external });
    envs.push(env);
    expect(env.database.kind).toBe('postgresql');
    const signed = await env.signUpWithPassword({ email: 'm@example.test', password: 'p' });
    // sqlite and postgresql adapters expose the same method surface — the same
    // sign-up call round-trips through either without branching.
    expect(await external.getSession(signed.session.id)).not.toBeNull();
  });

  it('deleteUser cascades sessions and oauth links', async () => {
    const env = await setupLuciaEnv();
    envs.push(env);
    const signed = await env.signInWithOAuth('google', { sub: 'g-42', email: 'n@example.test' });
    await env.database.deleteUser(signed.user.id);
    expect(await env.database.getUser(signed.user.id)).toBeNull();
    expect(await env.database.getSession(signed.session.id)).toBeNull();
    expect(
      await env.database.getUserByOAuthAccount({ provider: 'google', providerAccountId: 'g-42' }),
    ).toBeNull();
  });

  it('stop() resets the in-memory state to a blank slate', async () => {
    const env = await setupLuciaEnv();
    await env.signUpWithPassword({ email: 'o@example.test', password: 'p' });
    await env.stop();
    expect(await env.database.getUserByEmail('o@example.test')).toBeNull();
  });
});
