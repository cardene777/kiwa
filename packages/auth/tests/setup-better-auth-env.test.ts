import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createInMemoryBetterAuthAdapter,
  generateBetterAuthSessionToken,
  generateTotpCode,
  generateTotpSecret,
  hashBetterAuthPassword,
  setupBetterAuthEnv,
  verifyBetterAuthPassword,
  verifyTotpCode,
  type BetterAuthTestEnv,
} from '../src/index.js';
import { __resetBetterAuthCounters } from '../src/better-auth/adapter.js';
import { __resetBetterAuthProviderCounter } from '../src/better-auth/providers.js';

const envs: BetterAuthTestEnv[] = [];

beforeEach(() => {
  __resetBetterAuthProviderCounter();
  __resetBetterAuthCounters();
});

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('setupBetterAuthEnv (defaults)', () => {
  it('exposes google and github oauth mocks', async () => {
    const env = await setupBetterAuthEnv();
    envs.push(env);
    expect(env.providers.google.id).toBe('google');
    expect(env.providers.github.id).toBe('github');
  });

  it('defaults to the prisma adapter kind', async () => {
    const env = await setupBetterAuthEnv();
    envs.push(env);
    expect(env.database.kind).toBe('prisma');
  });

  it('honours drizzle and kysely database.kind hints when building the default adapter', async () => {
    const drizzle = await setupBetterAuthEnv({ database: { kind: 'drizzle' } });
    envs.push(drizzle);
    expect(drizzle.database.kind).toBe('drizzle');
    const kysely = await setupBetterAuthEnv({ database: { kind: 'kysely' } });
    envs.push(kysely);
    expect(kysely.database.kind).toBe('kysely');
  });

  it('rejects a non-positive sessionExpiration', async () => {
    await expect(setupBetterAuthEnv({ sessionExpiration: 0 })).rejects.toThrow(
      /sessionExpiration/,
    );
    await expect(setupBetterAuthEnv({ sessionExpiration: -1 })).rejects.toThrow(
      /sessionExpiration/,
    );
  });

  it('rejects a non-positive verificationExpiration', async () => {
    await expect(
      setupBetterAuthEnv({ verificationExpiration: 0 }),
    ).rejects.toThrow(/verificationExpiration/);
  });

  it('rejects an empty providers list', async () => {
    await expect(setupBetterAuthEnv({ providers: [] })).rejects.toThrow(/providers/);
  });
});

describe('setupBetterAuthEnv (password auth)', () => {
  it('signUpWithPassword creates a user + session and refuses duplicate emails', async () => {
    const env = await setupBetterAuthEnv();
    envs.push(env);
    const first = await env.signUpWithPassword({
      email: 'alice@example.test',
      password: 'correct-horse-battery-staple',
    });
    expect(first.user.email).toBe('alice@example.test');
    expect(first.user.emailVerified).toBe(false);
    expect(first.user.passwordHash).toMatch(/^\$scrypt-mock\$/);
    expect(first.session.token).toHaveLength(40);

    await expect(
      env.signUpWithPassword({
        email: 'alice@example.test',
        password: 'another-one',
      }),
    ).rejects.toThrow(/already registered/);
  });

  it('signInWithPassword issues a fresh session on the correct password', async () => {
    const env = await setupBetterAuthEnv();
    envs.push(env);
    await env.signUpWithPassword({ email: 'bob@example.test', password: 'hunter2' });
    const signed = await env.signInWithPassword({
      email: 'bob@example.test',
      password: 'hunter2',
    });
    expect(signed.user.email).toBe('bob@example.test');
    expect(signed.session.userId).toBe(signed.user.id);
  });

  it('signInWithPassword rejects wrong password / unknown email with the same generic error', async () => {
    const env = await setupBetterAuthEnv();
    envs.push(env);
    await env.signUpWithPassword({ email: 'c@example.test', password: 'correct' });
    await expect(
      env.signInWithPassword({ email: 'c@example.test', password: 'wrong' }),
    ).rejects.toThrow(/invalid email or password/);
    await expect(
      env.signInWithPassword({ email: 'nobody@example.test', password: 'x' }),
    ).rejects.toThrow(/invalid email or password/);
  });

  it('signUpWithPassword rejects when emailAndPassword plugin is not enabled', async () => {
    const env = await setupBetterAuthEnv({ plugins: [] });
    envs.push(env);
    await expect(
      env.signUpWithPassword({ email: 'z@example.test', password: 'x' }),
    ).rejects.toThrow(/emailAndPassword/);
  });

  it('hashPassword refuses empty passwords and verifyPassword handles malformed hash gracefully', async () => {
    await expect(hashBetterAuthPassword('')).rejects.toThrow(/empty/);
    expect(await verifyBetterAuthPassword('not-a-valid-hash', 'x')).toBe(false);
  });
});

describe('setupBetterAuthEnv (oauth)', () => {
  it('signInWithOAuth(google) creates a user on first sign-in and reuses it on the next', async () => {
    const env = await setupBetterAuthEnv();
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
    expect(second.user.emailVerified).toBe(true);
    expect(second.session.token).not.toBe(first.session.token);
  });

  it('signInWithOAuth on github reuses a user that already signed up via password on the same email', async () => {
    const env = await setupBetterAuthEnv();
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
    const env = await setupBetterAuthEnv({ providers: ['google'] });
    envs.push(env);
    await expect(env.signInWithOAuth('github')).rejects.toThrow(/github/);
  });
});

describe('setupBetterAuthEnv (magic link)', () => {
  it('sendMagicLink emits a token and consumeMagicLink creates the user + verifies email', async () => {
    const env = await setupBetterAuthEnv({
      plugins: ['emailAndPassword', 'magicLink'],
    });
    envs.push(env);
    const { token } = await env.sendMagicLink({ email: 'ml@example.test' });
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    const signed = await env.consumeMagicLink({
      email: 'ml@example.test',
      token,
    });
    expect(signed.user.email).toBe('ml@example.test');
    expect(signed.user.emailVerified).toBe(true);
    expect(signed.session.token).toHaveLength(40);
  });

  it('consumeMagicLink flips emailVerified for a pre-existing password user', async () => {
    const env = await setupBetterAuthEnv({
      plugins: ['emailAndPassword', 'magicLink'],
    });
    envs.push(env);
    const pwd = await env.signUpWithPassword({
      email: 'mixed@example.test',
      password: 'p',
    });
    expect(pwd.user.emailVerified).toBe(false);
    const { token } = await env.sendMagicLink({ email: 'mixed@example.test' });
    const signed = await env.consumeMagicLink({
      email: 'mixed@example.test',
      token,
    });
    expect(signed.user.id).toBe(pwd.user.id);
    expect(signed.user.emailVerified).toBe(true);
  });

  it('consumeMagicLink rejects an unknown token and refuses to reuse a consumed token', async () => {
    const env = await setupBetterAuthEnv({
      plugins: ['emailAndPassword', 'magicLink'],
    });
    envs.push(env);
    await expect(
      env.consumeMagicLink({ email: 'x@example.test', token: 'nope' }),
    ).rejects.toThrow(/invalid or expired/);
    const { token } = await env.sendMagicLink({ email: 'r@example.test' });
    await env.consumeMagicLink({ email: 'r@example.test', token });
    await expect(
      env.consumeMagicLink({ email: 'r@example.test', token }),
    ).rejects.toThrow(/invalid or expired/);
  });

  it('sendMagicLink evicts an expired token on consume', async () => {
    const env = await setupBetterAuthEnv({
      plugins: ['emailAndPassword', 'magicLink'],
      verificationExpiration: 60,
    });
    envs.push(env);
    const { token } = await env.sendMagicLink({ email: 'exp@example.test' });
    // Force-expire the verification row without waiting on the wall clock.
    await env.database.createVerification({
      identifier: 'exp@example.test',
      value: token,
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(
      env.consumeMagicLink({ email: 'exp@example.test', token }),
    ).rejects.toThrow(/invalid or expired/);
  });

  it('sendMagicLink rejects when the magicLink plugin is not enabled', async () => {
    const env = await setupBetterAuthEnv();
    envs.push(env);
    await expect(env.sendMagicLink({ email: 'a@example.test' })).rejects.toThrow(
      /magicLink/,
    );
  });
});

describe('setupBetterAuthEnv (2FA / TOTP)', () => {
  it('enrollTwoFactor issues a secret and verifyTwoFactorCode accepts the current code', async () => {
    const env = await setupBetterAuthEnv({
      plugins: ['emailAndPassword', 'twoFactor'],
    });
    envs.push(env);
    const signed = await env.signUpWithPassword({
      email: '2fa@example.test',
      password: 'p',
    });
    const { secret } = await env.enrollTwoFactor({ userId: signed.user.id });
    expect(secret.length).toBeGreaterThan(0);
    const code = generateTotpCode(secret);
    expect(await env.verifyTwoFactorCode({ userId: signed.user.id, code })).toBe(true);
  });

  it('verifyTwoFactorCode rejects a wrong / malformed code', async () => {
    const env = await setupBetterAuthEnv({
      plugins: ['emailAndPassword', 'twoFactor'],
    });
    envs.push(env);
    const signed = await env.signUpWithPassword({
      email: 't@example.test',
      password: 'p',
    });
    await env.enrollTwoFactor({ userId: signed.user.id });
    expect(await env.verifyTwoFactorCode({ userId: signed.user.id, code: '000000' })).toBe(
      false,
    );
    expect(
      await env.verifyTwoFactorCode({ userId: signed.user.id, code: 'abcdef' }),
    ).toBe(false);
  });

  it('verifyTwoFactorCode rejects a user that never enrolled', async () => {
    const env = await setupBetterAuthEnv({
      plugins: ['emailAndPassword', 'twoFactor'],
    });
    envs.push(env);
    const signed = await env.signUpWithPassword({
      email: 'noenrol@example.test',
      password: 'p',
    });
    await expect(
      env.verifyTwoFactorCode({ userId: signed.user.id, code: '123456' }),
    ).rejects.toThrow(/not enrolled/);
  });

  it('generateTotpCode / verifyTotpCode are deterministic against a fixed clock', () => {
    const secret = generateTotpSecret();
    const nowMs = 1_700_000_000_000; // fixed epoch ms
    const code = generateTotpCode(secret, nowMs);
    expect(code).toMatch(/^\d{6}$/);
    expect(verifyTotpCode(secret, code, nowMs)).toBe(true);
    // 60-second drift is outside the accepted [-30s, 0s] window.
    expect(verifyTotpCode(secret, code, nowMs + 60_000)).toBe(false);
  });

  it('enrollTwoFactor rejects when the twoFactor plugin is not enabled', async () => {
    const env = await setupBetterAuthEnv();
    envs.push(env);
    await expect(env.enrollTwoFactor({ userId: 'user-1' })).rejects.toThrow(/twoFactor/);
  });
});

describe('setupBetterAuthEnv (session lifecycle)', () => {
  it('validateSession returns the user for a fresh token', async () => {
    const env = await setupBetterAuthEnv();
    envs.push(env);
    const signed = await env.signUpWithPassword({
      email: 'f@example.test',
      password: 'p',
    });
    const validated = await env.validateSession(signed.session.token);
    expect(validated?.user.id).toBe(signed.user.id);
  });

  it('validateSession returns null and evicts an expired session', async () => {
    const env = await setupBetterAuthEnv({ sessionExpiration: 60 });
    envs.push(env);
    const signed = await env.signUpWithPassword({
      email: 'h@example.test',
      password: 'p',
    });
    const inner = await env.database.getSession(signed.session.id);
    if (!inner) throw new Error('expected session to exist for the test');
    inner.expiresAt = new Date(Date.now() - 1000);
    await env.database.createSession(inner);
    const validated = await env.validateSession(signed.session.token);
    expect(validated).toBeNull();
    expect(await env.database.getSession(signed.session.id)).toBeNull();
  });

  it('validateSession returns null for an unknown token', async () => {
    const env = await setupBetterAuthEnv();
    envs.push(env);
    expect(await env.validateSession('not-a-token')).toBeNull();
  });

  it('invalidateSession clears a single token', async () => {
    const env = await setupBetterAuthEnv();
    envs.push(env);
    const signed = await env.signUpWithPassword({ email: 'i@example.test', password: 'p' });
    await env.invalidateSession(signed.session.token);
    expect(await env.validateSession(signed.session.token)).toBeNull();
  });

  it('invalidateUserSessions clears every session for the user', async () => {
    const env = await setupBetterAuthEnv();
    envs.push(env);
    const a = await env.signUpWithPassword({ email: 'j@example.test', password: 'p' });
    const b = await env.signInWithPassword({ email: 'j@example.test', password: 'p' });
    await env.invalidateUserSessions(a.user.id);
    expect(await env.validateSession(a.session.token)).toBeNull();
    expect(await env.validateSession(b.session.token)).toBeNull();
  });

  it('generateBetterAuthSessionToken emits a 40-char url-safe string', () => {
    const token = generateBetterAuthSessionToken();
    expect(token).toMatch(/^[a-z0-9]{40}$/);
  });
});

describe('setupBetterAuthEnv (adapter compat)', () => {
  it('external prisma-shaped adapter can be injected', async () => {
    const external = createInMemoryBetterAuthAdapter('prisma');
    const env = await setupBetterAuthEnv({ database: external });
    envs.push(env);
    await env.signUpWithPassword({ email: 'l@example.test', password: 'p' });
    expect(await external.getUserByEmail('l@example.test')).not.toBeNull();
  });

  it('external drizzle-shaped adapter can be injected', async () => {
    const external = createInMemoryBetterAuthAdapter('drizzle');
    const env = await setupBetterAuthEnv({ database: external });
    envs.push(env);
    expect(env.database.kind).toBe('drizzle');
    const signed = await env.signUpWithPassword({ email: 'm@example.test', password: 'p' });
    expect(await external.getSession(signed.session.id)).not.toBeNull();
  });

  it('external kysely-shaped adapter can be injected', async () => {
    const external = createInMemoryBetterAuthAdapter('kysely');
    const env = await setupBetterAuthEnv({ database: external });
    envs.push(env);
    expect(env.database.kind).toBe('kysely');
    const signed = await env.signInWithOAuth('google', {
      sub: 'ky-1',
      email: 'ky@example.test',
    });
    expect(await external.getSession(signed.session.id)).not.toBeNull();
  });

  it('deleteUser cascades sessions, oauth links, memberships and passkeys', async () => {
    const env = await setupBetterAuthEnv({
      plugins: ['emailAndPassword', 'organizations', 'passkey'],
    });
    envs.push(env);
    const signed = await env.signInWithOAuth('google', {
      sub: 'g-42',
      email: 'n@example.test',
    });
    const org = await env.createOrganization({
      name: 'Acme',
      slug: 'acme',
      userId: signed.user.id,
    });
    await env.registerPasskey({
      userId: signed.user.id,
      credentialId: 'cred-1',
      publicKey: 'pk-1',
    });
    await env.database.deleteUser(signed.user.id);
    expect(await env.database.getUser(signed.user.id)).toBeNull();
    expect(await env.database.getSession(signed.session.id)).toBeNull();
    expect(
      await env.database.getUserByAccount({ provider: 'google', providerAccountId: 'g-42' }),
    ).toBeNull();
    expect(await env.database.getMemberships(signed.user.id)).toHaveLength(0);
    expect(await env.database.getPasskeysForUser(signed.user.id)).toHaveLength(0);
    // Organization row itself is retained (owner id becomes a dangling reference,
    // matching Better Auth's `onDelete: SET NULL` behaviour).
    expect(await env.database.getOrganization(org.id)).not.toBeNull();
  });

  it('stop() resets the in-memory state to a blank slate', async () => {
    const env = await setupBetterAuthEnv();
    await env.signUpWithPassword({ email: 'o@example.test', password: 'p' });
    await env.stop();
    expect(await env.database.getUserByEmail('o@example.test')).toBeNull();
  });
});

describe('setupBetterAuthEnv (organizations plugin)', () => {
  it('createOrganization records the creator as owner and adds a membership row', async () => {
    const env = await setupBetterAuthEnv({
      plugins: ['emailAndPassword', 'organizations'],
    });
    envs.push(env);
    const owner = await env.signUpWithPassword({
      email: 'own@example.test',
      password: 'p',
    });
    const org = await env.createOrganization({
      name: 'Acme',
      slug: 'acme',
      userId: owner.user.id,
    });
    expect(org.createdBy).toBe(owner.user.id);
    const memberships = await env.database.getMemberships(owner.user.id);
    expect(memberships).toEqual([
      { organizationId: org.id, userId: owner.user.id, role: 'owner' },
    ]);
  });

  it('inviteToOrganization defaults to the member role and honours an explicit admin role', async () => {
    const env = await setupBetterAuthEnv({
      plugins: ['emailAndPassword', 'organizations'],
    });
    envs.push(env);
    const owner = await env.signUpWithPassword({ email: 'ow@example.test', password: 'p' });
    const invitee1 = await env.signUpWithPassword({ email: 'v1@example.test', password: 'p' });
    const invitee2 = await env.signUpWithPassword({ email: 'v2@example.test', password: 'p' });
    const org = await env.createOrganization({
      name: 'Acme',
      slug: 'acme',
      userId: owner.user.id,
    });
    const memberDefault = await env.inviteToOrganization({
      organizationId: org.id,
      userId: invitee1.user.id,
    });
    expect(memberDefault.role).toBe('member');
    const admin = await env.inviteToOrganization({
      organizationId: org.id,
      userId: invitee2.user.id,
      role: 'admin',
    });
    expect(admin.role).toBe('admin');
  });

  it('createOrganization rejects when the organizations plugin is not enabled', async () => {
    const env = await setupBetterAuthEnv();
    envs.push(env);
    await expect(
      env.createOrganization({ name: 'x', slug: 'x', userId: 'user-1' }),
    ).rejects.toThrow(/organizations/);
  });

  it('inviteToOrganization rejects an unknown organization or user', async () => {
    const env = await setupBetterAuthEnv({
      plugins: ['emailAndPassword', 'organizations'],
    });
    envs.push(env);
    const owner = await env.signUpWithPassword({ email: 'oo@example.test', password: 'p' });
    await expect(
      env.inviteToOrganization({ organizationId: 'org-nope', userId: owner.user.id }),
    ).rejects.toThrow(/organization/);
    const org = await env.createOrganization({
      name: 'x',
      slug: 'x',
      userId: owner.user.id,
    });
    await expect(
      env.inviteToOrganization({ organizationId: org.id, userId: 'user-nope' }),
    ).rejects.toThrow(/user/);
  });
});

describe('setupBetterAuthEnv (passkey plugin)', () => {
  it('registerPasskey persists the credential and surfaces it in getPasskeysForUser', async () => {
    const env = await setupBetterAuthEnv({
      plugins: ['emailAndPassword', 'passkey'],
    });
    envs.push(env);
    const signed = await env.signUpWithPassword({
      email: 'pk@example.test',
      password: 'p',
    });
    const passkey = await env.registerPasskey({
      userId: signed.user.id,
      credentialId: 'cred-abc',
      publicKey: 'pk-xyz',
    });
    expect(passkey.id).toMatch(/^passkey-/);
    const stored = await env.database.getPasskeysForUser(signed.user.id);
    expect(stored).toEqual([passkey]);
  });

  it('registerPasskey rejects when the passkey plugin is not enabled', async () => {
    const env = await setupBetterAuthEnv();
    envs.push(env);
    await expect(
      env.registerPasskey({ userId: 'user-1', credentialId: 'c', publicKey: 'p' }),
    ).rejects.toThrow(/passkey/);
  });
});
