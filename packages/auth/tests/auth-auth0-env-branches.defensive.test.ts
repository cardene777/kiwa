import { describe, expect, it } from 'vitest';
import { setupAuth0Env } from '../src/auth0/setup-auth0-env.js';

describe('auth0 env users defensive branches', () => {
  it('users.get throws when userId unknown', async () => {
    const env = await setupAuth0Env();
    await expect(env.users.get('user-unknown')).rejects.toThrow(
      /not found user-unknown/,
    );
  });

  it('users.getByEmail returns null for unknown email', async () => {
    const env = await setupAuth0Env();
    const user = await env.users.getByEmail('nobody@example.com');
    expect(user).toBeNull();
  });

  it('users.update filters patch to allowed fields', async () => {
    const env = await setupAuth0Env();
    const created = await env.users.create({
      email: 'up@example.com',
      email_verified: true,
    });
    const updated = await env.users.update(created.user_id, {
      name: 'Alice',
      nickname: 'ally',
      picture: 'https://example.com/pic.png',
      app_metadata: { role: 'admin' },
      user_metadata: { pref: 'dark' },
      blocked: false,
    });
    expect(updated.name).toBe('Alice');
    expect(updated.nickname).toBe('ally');
    expect(updated.picture).toContain('example.com');
  });

  it('users.delete removes user + password vault entry', async () => {
    const env = await setupAuth0Env();
    const created = await env.users.create({
      email: 'del@example.com',
      email_verified: true,
    });
    await env.users.delete(created.user_id);
    await expect(env.users.get(created.user_id)).rejects.toThrow();
  });

  it('users.list returns all users', async () => {
    const env = await setupAuth0Env();
    await env.users.create({ email: 'a@example.com', email_verified: true });
    await env.users.create({ email: 'b@example.com', email_verified: true });
    const list = await env.users.list();
    expect(list.length).toBeGreaterThanOrEqual(2);
  });
});

describe('auth0 authenticate signUp defensive branches', () => {
  it('signUp rejects duplicate email', async () => {
    const env = await setupAuth0Env();
    await env.authenticate.signUp({
      email: 'dup@example.com',
      password: 'Str0ngPassword!',
    });
    await expect(
      env.authenticate.signUp({
        email: 'dup@example.com',
        password: 'AnotherPass!',
      }),
    ).rejects.toThrow(/user with email dup@example.com already exists/);
  });

  it('signUp with explicit connection sets it on identity', async () => {
    const env = await setupAuth0Env();
    const result = await env.authenticate.signUp({
      email: 'conn@example.com',
      password: 'Str0ngPassword!',
      connection: 'Username-Password-Authentication',
    });
    expect(result.user.identities[0]?.connection).toBe(
      'Username-Password-Authentication',
    );
  });

  it('signUp with default connection uses Username-Password-Authentication', async () => {
    const env = await setupAuth0Env();
    const result = await env.authenticate.signUp({
      email: 'def@example.com',
      password: 'Str0ngPassword!',
    });
    expect(result.user.identities[0]?.connection).toBe(
      'Username-Password-Authentication',
    );
  });
});

describe('auth0 setup guards', () => {
  it('throws when tokenExpiration is 0', async () => {
    await expect(
      setupAuth0Env({ tokenExpiration: 0 }),
    ).rejects.toThrow(/tokenExpiration must be a positive number/);
  });

  it('throws when tokenExpiration is negative', async () => {
    await expect(
      setupAuth0Env({ tokenExpiration: -10 }),
    ).rejects.toThrow(/tokenExpiration must be a positive number/);
  });

  it('uses custom issuer when provided', async () => {
    const env = await setupAuth0Env({
      issuer: 'https://custom.auth0.com/',
    });
    expect(env.issuer).toBe('https://custom.auth0.com/');
  });

  it('uses custom tenant + default issuer construction', async () => {
    const env = await setupAuth0Env({ tenant: 'my-tenant' });
    expect(env.issuer).toContain('my-tenant');
  });
});
