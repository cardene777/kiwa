import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createInMemoryAdapter,
  setupNextAuthEnv,
  type NextAuthTestEnv,
} from '../src/index.js';
import { __resetProviderCounter } from '../src/providers.js';
import { __resetSessionCounter } from '../src/session.js';

const envs: NextAuthTestEnv[] = [];

beforeEach(() => {
  __resetProviderCounter();
  __resetSessionCounter();
});

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('setupNextAuthEnv (defaults)', () => {
  it('exposes the three built-in provider mocks', async () => {
    const env = await setupNextAuthEnv();
    envs.push(env);
    expect(env.providers.google.id).toBe('google');
    expect(env.providers.github.id).toBe('github');
    expect(env.providers.email.id).toBe('email');
  });

  it('defaults to the jwt session strategy', async () => {
    const env = await setupNextAuthEnv();
    envs.push(env);
    expect(env.session.strategy).toBe('jwt');
  });

  it('provides an in-memory database adapter when none is supplied', async () => {
    const env = await setupNextAuthEnv();
    envs.push(env);
    expect(typeof env.database.createUser).toBe('function');
    expect(typeof env.database.linkAccount).toBe('function');
  });
});

describe('setupNextAuthEnv (jwt strategy)', () => {
  it('signIn(google) creates a user and returns a session token', async () => {
    const env = await setupNextAuthEnv({ session: { strategy: 'jwt' } });
    envs.push(env);
    const result = await env.signIn('google', { email: 'alice@example.test', name: 'Alice' });
    expect(result.strategy).toBe('jwt');
    expect(result.user.email).toBe('alice@example.test');
    expect(result.user.name).toBe('Alice');
    expect(result.session.sessionToken).toMatch(/^jwt-session-/);
    expect(result.session.expires.getTime()).toBeGreaterThan(Date.now());
  });

  it('signIn twice with the same provider account reuses the user', async () => {
    const env = await setupNextAuthEnv();
    envs.push(env);
    const first = await env.signIn('github', { sub: 'gh-1', email: 'bob@example.test' });
    const second = await env.signIn('github', { sub: 'gh-1', email: 'bob@example.test' });
    expect(second.user.id).toBe(first.user.id);
  });

  it('jwt getSession returns the user for a valid token', async () => {
    const env = await setupNextAuthEnv();
    envs.push(env);
    const signed = await env.signIn('google', { email: 'c@example.test' });
    const session = await env.getSession(signed.session.sessionToken);
    expect(session?.user.id).toBe(signed.user.id);
  });

  it('jwt signOut is stateless — the token still resolves', async () => {
    const env = await setupNextAuthEnv({ session: { strategy: 'jwt' } });
    envs.push(env);
    const signed = await env.signIn('google');
    await env.signOut(signed.session.sessionToken);
    // JWT strategy: the token is opaque and stateless, so the mock cannot
    // revoke it. Real NextAuth expects clients to drop the cookie themselves.
    const session = await env.getSession(signed.session.sessionToken);
    expect(session).not.toBeNull();
  });
});

describe('setupNextAuthEnv (database strategy)', () => {
  it('persists the session row on sign-in', async () => {
    const env = await setupNextAuthEnv({ session: { strategy: 'database' } });
    envs.push(env);
    const signed = await env.signIn('google', { email: 'd@example.test' });
    expect(signed.session.sessionToken).toMatch(/^database-session-/);
    const row = await env.database.getSessionAndUser(signed.session.sessionToken);
    expect(row?.user.id).toBe(signed.user.id);
  });

  it('database signOut invalidates the session token', async () => {
    const env = await setupNextAuthEnv({ session: { strategy: 'database' } });
    envs.push(env);
    const signed = await env.signIn('github', { email: 'e@example.test' });
    await env.signOut(signed.session.sessionToken);
    const session = await env.getSession(signed.session.sessionToken);
    expect(session).toBeNull();
  });

  it('database getSession returns null for an expired token', async () => {
    const env = await setupNextAuthEnv({ session: { strategy: 'database', maxAge: 1 } });
    envs.push(env);
    const signed = await env.signIn('google', { email: 'f@example.test' });
    // Force-expire the persisted row so we don't rely on wall-clock timing.
    await env.database.updateSession({
      sessionToken: signed.session.sessionToken,
      expires: new Date(Date.now() - 1000),
    });
    const session = await env.getSession(signed.session.sessionToken);
    expect(session).toBeNull();
  });
});

describe('setupNextAuthEnv (provider mocks)', () => {
  it('google provider issues a synthetic providerAccountId when none is given', async () => {
    const env = await setupNextAuthEnv();
    envs.push(env);
    const profile = await env.providers.google.signIn();
    expect(profile.provider).toBe('google');
    expect(profile.providerAccountId).toMatch(/^google-/);
    expect(profile.email).toMatch(/@example\.test$/);
  });

  it('github provider preserves an explicit sub and email', async () => {
    const env = await setupNextAuthEnv();
    envs.push(env);
    const profile = await env.providers.github.signIn({ sub: '42', email: 'g@example.test' });
    expect(profile.providerAccountId).toBe('42');
    expect(profile.email).toBe('g@example.test');
  });

  it('email provider (magic link) refuses to sign in without an email', async () => {
    const env = await setupNextAuthEnv();
    envs.push(env);
    await expect(env.providers.email.signIn()).rejects.toThrow(/email/);
  });

  it('signIn with an unconfigured provider throws', async () => {
    const env = await setupNextAuthEnv({ providers: ['google'] });
    envs.push(env);
    await expect(env.signIn('github')).rejects.toThrow(/github/);
  });
});

describe('setupNextAuthEnv (database adapter contract)', () => {
  it('createUser then getUser round-trips the record', async () => {
    const env = await setupNextAuthEnv();
    envs.push(env);
    const user = await env.database.createUser({ email: 'h@example.test', name: 'Helen' });
    const fetched = await env.database.getUser(user.id);
    expect(fetched?.email).toBe('h@example.test');
    expect(fetched?.name).toBe('Helen');
  });

  it('updateUser rewrites the email index', async () => {
    const env = await setupNextAuthEnv();
    envs.push(env);
    const user = await env.database.createUser({ email: 'old@example.test' });
    await env.database.updateUser({ id: user.id, email: 'new@example.test' });
    expect(await env.database.getUserByEmail('old@example.test')).toBeNull();
    expect((await env.database.getUserByEmail('new@example.test'))?.id).toBe(user.id);
  });

  it('deleteUser removes accounts and sessions tied to the user', async () => {
    const env = await setupNextAuthEnv({ session: { strategy: 'database' } });
    envs.push(env);
    const signed = await env.signIn('google', { email: 'i@example.test' });
    await env.database.deleteUser(signed.user.id);
    expect(await env.database.getUser(signed.user.id)).toBeNull();
    expect(
      await env.database.getUserByAccount({ provider: 'google', providerAccountId: signed.user.id }),
    ).toBeNull();
    expect(await env.database.getSessionAndUser(signed.session.sessionToken)).toBeNull();
  });

  it('linkAccount then unlinkAccount clears the account row', async () => {
    const env = await setupNextAuthEnv();
    envs.push(env);
    const user = await env.database.createUser({ email: 'j@example.test' });
    await env.database.linkAccount({
      userId: user.id,
      provider: 'github',
      providerAccountId: 'gh-99',
      type: 'oauth',
    });
    await env.database.unlinkAccount({ provider: 'github', providerAccountId: 'gh-99' });
    expect(
      await env.database.getUserByAccount({ provider: 'github', providerAccountId: 'gh-99' }),
    ).toBeNull();
  });

  it('verification tokens are single-use', async () => {
    const env = await setupNextAuthEnv();
    envs.push(env);
    await env.database.createVerificationToken({
      identifier: 'k@example.test',
      token: 'magic',
      expires: new Date(Date.now() + 60_000),
    });
    const first = await env.database.useVerificationToken({
      identifier: 'k@example.test',
      token: 'magic',
    });
    const second = await env.database.useVerificationToken({
      identifier: 'k@example.test',
      token: 'magic',
    });
    expect(first?.token).toBe('magic');
    expect(second).toBeNull();
  });

  it('external adapter (Prisma / Drizzle compatible) can be injected', async () => {
    const external = createInMemoryAdapter();
    const env = await setupNextAuthEnv({ database: external });
    envs.push(env);
    await env.signIn('google', { email: 'l@example.test' });
    // The externally-supplied adapter observed the write, proving injection.
    const fetched = await external.getUserByEmail('l@example.test');
    expect(fetched?.email).toBe('l@example.test');
  });

  it('stop() resets the internal adapter to a blank slate', async () => {
    const env = await setupNextAuthEnv();
    await env.signIn('google', { email: 'm@example.test' });
    await env.stop();
    expect(await env.database.getUserByEmail('m@example.test')).toBeNull();
  });
});

describe('setupNextAuthEnv (errors)', () => {
  it('rejects an unknown session strategy', async () => {
    await expect(
      setupNextAuthEnv({ session: { strategy: 'invalid' as unknown as 'jwt' } }),
    ).rejects.toThrow(/session strategy/);
  });

  it('rejects an empty providers list', async () => {
    await expect(setupNextAuthEnv({ providers: [] })).rejects.toThrow(/providers/);
  });

  it('rejects an unknown provider kind at build time', async () => {
    await expect(
      setupNextAuthEnv({ providers: ['telegram' as unknown as 'google'] }),
    ).rejects.toThrow(/Unknown provider/);
  });
});
