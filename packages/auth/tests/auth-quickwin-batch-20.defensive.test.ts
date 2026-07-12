import { describe, expect, it } from 'vitest';
import { setupAuth0Env } from '../src/auth0/setup-auth0-env.js';

describe('auth0/setup-auth0-env defensive branches', () => {
  it('throws when tokenExpiration is zero or negative', async () => {
    await expect(setupAuth0Env({ tokenExpiration: 0 })).rejects.toThrow(
      /tokenExpiration must be a positive number/,
    );
    await expect(setupAuth0Env({ tokenExpiration: -60 })).rejects.toThrow(
      /tokenExpiration must be a positive number/,
    );
  });

  it('uses default tenant when unspecified', async () => {
    const env = await setupAuth0Env();
    expect(env.issuer).toContain('.auth0.com');
  });

  it('accepts custom issuer override', async () => {
    const env = await setupAuth0Env({ issuer: 'https://custom.auth0.com/' });
    expect(env.issuer).toBe('https://custom.auth0.com/');
  });

  it('users.create throws when email is empty', async () => {
    const env = await setupAuth0Env();
    await expect(env.users.create({ email: '' })).rejects.toThrow(/valid email/);
  });

  it('users.create throws when email has no @', async () => {
    const env = await setupAuth0Env();
    await expect(env.users.create({ email: 'no-at-sign' })).rejects.toThrow(/valid email/);
  });

  it('users.create builds user with social connection (isSocial=true)', async () => {
    const env = await setupAuth0Env();
    const user = await env.users.create({
      email: 'a@example.com',
      connection: 'google-oauth2',
    });
    expect(user.identities[0]?.isSocial).toBe(true);
    expect(user.identities[0]?.connection).toBe('google-oauth2');
  });

  it('users.create builds user with password connection (isSocial=false)', async () => {
    const env = await setupAuth0Env();
    const user = await env.users.create({
      email: 'b@example.com',
    });
    expect(user.identities[0]?.isSocial).toBe(false);
  });

  it('users.get throws when userId not found', async () => {
    const env = await setupAuth0Env();
    await expect(env.users.get('auth0|nonexistent')).rejects.toThrow(/not found/);
  });

  it('users.getByEmail returns null for unknown email', async () => {
    const env = await setupAuth0Env();
    expect(await env.users.getByEmail('nobody@example.com')).toBeNull();
  });

  it('authenticate.signIn throws when user email unknown', async () => {
    const env = await setupAuth0Env();
    await expect(
      env.authenticate.signIn({ email: 'ghost@example.com', password: 'x' }),
    ).rejects.toThrow(/unknown user email/);
  });

  it('authenticate.signIn throws when user is blocked', async () => {
    const env = await setupAuth0Env();
    const user = await env.users.create({ email: 'a@example.com' });
    await env.users.update(user.user_id, { blocked: true });
    await expect(
      env.authenticate.signIn({ email: 'a@example.com', password: 'x' }),
    ).rejects.toThrow(/is blocked/);
  });

  it('authenticate.signIn throws when no password on file (password connection)', async () => {
    const env = await setupAuth0Env();
    await env.users.create({ email: 'a@example.com' });
    await expect(
      env.authenticate.signIn({ email: 'a@example.com', password: 'x' }),
    ).rejects.toThrow(/no password on file/);
  });
});
