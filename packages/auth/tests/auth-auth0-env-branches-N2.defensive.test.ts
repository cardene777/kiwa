import { afterEach, describe, expect, it } from 'vitest';
import {
  setupAuth0Env,
  type Auth0TestEnv,
} from '../src/index.js';

const envs: Auth0TestEnv[] = [];
afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function makeEnv(): Promise<Auth0TestEnv> {
  const env = await setupAuth0Env();
  envs.push(env);
  return env;
}

describe('setupAuth0Env defensive branches — users + rules + tokens', () => {
  it('users.create throws when email is missing', async () => {
    const env = await makeEnv();
    await expect(
      env.users.create({ email: undefined as never }),
    ).rejects.toThrow(/email must be a valid email/);
  });

  it('users.create throws when email lacks @ symbol', async () => {
    const env = await makeEnv();
    await expect(
      env.users.create({ email: 'not-an-email' }),
    ).rejects.toThrow(/email must be a valid email/);
  });

  it('users.create with social connection sets isSocial=true', async () => {
    const env = await makeEnv();
    const user = await env.users.create({
      email: 'social@example.com',
      connection: 'google-oauth2',
    });
    expect(user.identities[0]?.isSocial).toBe(true);
  });

  it('users.create with default connection sets isSocial=false', async () => {
    const env = await makeEnv();
    const user = await env.users.create({
      email: 'pw@example.com',
    });
    expect(user.identities[0]?.isSocial).toBe(false);
  });

  it('users.create preserves nickname / picture / app_metadata / user_metadata', async () => {
    const env = await makeEnv();
    const user = await env.users.create({
      email: 'meta@example.com',
      nickname: 'nick',
      picture: 'https://example.com/pic.png',
      app_metadata: { role: 'admin' },
      user_metadata: { pref: 'dark' },
    });
    expect(user.nickname).toBe('nick');
    expect(user.picture).toBe('https://example.com/pic.png');
    expect(user.app_metadata).toEqual({ role: 'admin' });
    expect(user.user_metadata).toEqual({ pref: 'dark' });
  });

  it('rules.add + signIn runs rules that mutate context.idToken claims', async () => {
    const env = await makeEnv();
    await env.authenticate.signUp({
      email: 'rule@example.com',
      password: 'p',
    });
    env.rules.add((user, context, callback) => {
      const patched = {
        ...context,
        idToken: { ...context.idToken, custom_claim: 'added' },
      };
      callback(null, user, patched);
    });
    const result = await env.authenticate.signIn({
      email: 'rule@example.com',
      password: 'p',
    });
    const claims = await env.verifyIdToken(result.id_token);
    expect(claims.custom_claim).toBe('added');
  });

  it('rules.add short-circuits signIn when callback receives error', async () => {
    const env = await makeEnv();
    await env.authenticate.signUp({
      email: 'deny@example.com',
      password: 'p',
    });
    env.rules.add((user, context, callback) => {
      callback(new Error('rule-denied-login'));
    });
    await expect(
      env.authenticate.signIn({
        email: 'deny@example.com',
        password: 'p',
      }),
    ).rejects.toThrow(/rule-denied-login/);
  });

  it('rules that throw synchronously reject the login promise', async () => {
    const env = await makeEnv();
    await env.authenticate.signUp({
      email: 'throw@example.com',
      password: 'p',
    });
    env.rules.add(() => {
      throw new Error('rule-threw-sync');
    });
    await expect(
      env.authenticate.signIn({
        email: 'throw@example.com',
        password: 'p',
      }),
    ).rejects.toThrow(/rule-threw-sync/);
  });

  it('signIn with nonce field embeds nonce into id_token claims', async () => {
    const env = await makeEnv();
    await env.authenticate.signUp({
      email: 'nonce@example.com',
      password: 'p',
    });
    const result = await env.authenticate.signIn({
      email: 'nonce@example.com',
      password: 'p',
      nonce: 'nonce-abc-123',
    });
    const claims = await env.verifyIdToken(result.id_token);
    expect(claims.nonce).toBe('nonce-abc-123');
  });

  it('signIn throws when user is blocked', async () => {
    const env = await makeEnv();
    const user = await env.authenticate.signUp({
      email: 'blocked@example.com',
      password: 'p',
    });
    await env.users.update(user.user.user_id, { blocked: true });
    await expect(
      env.authenticate.signIn({
        email: 'blocked@example.com',
        password: 'p',
      }),
    ).rejects.toThrow(/is blocked/);
  });
});
