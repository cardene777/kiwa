import { afterEach, describe, expect, it } from 'vitest';
import { setupAuth0Env, type Auth0TestEnv } from '../src/index.js';

const envs: Auth0TestEnv[] = [];
afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('setupAuth0Env residual defensive branches — actions + tokens', () => {
  it('users.create identity has isSocial=true for github-oauth2 connection', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    const user = await env.users.create({
      email: 'gh@example.com',
      connection: 'github',
    });
    expect(user.identities[0]?.isSocial).toBe(true);
    expect(user.identities[0]?.provider).toBe('github');
  });

  it('users.create identity for password connection provides provider user_id split', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    const user = await env.users.create({
      email: 'sp@example.com',
    });
    expect(user.identities[0]?.user_id).toBeDefined();
    expect(user.identities[0]?.provider).toBe('Username-Password-Authentication');
  });

  it('rules callback with (err, undefined) preserves previous user unchanged', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    await env.authenticate.signUp({
      email: 'nouser@example.com',
      password: 'p',
    });
    env.rules.add((user, context, callback) => {
      callback(null, undefined, undefined);
    });
    const result = await env.authenticate.signIn({
      email: 'nouser@example.com',
      password: 'p',
    });
    expect(result.user.email).toBe('nouser@example.com');
  });

  it('actions.add + signIn embeds custom idToken claim via api.idToken.setCustomClaim', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    await env.authenticate.signUp({
      email: 'action@example.com',
      password: 'p',
    });
    env.actions.add('post-login', async (event, api) => {
      api.idToken.setCustomClaim('feature_flag', 'beta');
    });
    const result = await env.authenticate.signIn({
      email: 'action@example.com',
      password: 'p',
    });
    const claims = await env.verifyIdToken(result.id_token);
    expect(claims.feature_flag).toBe('beta');
  });

  it('actions user.setUserMetadata mutates user_metadata (post-registration)', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    await env.authenticate.signUp({
      email: 'meta@example.com',
      password: 'p',
    });
    env.actions.add('post-login', async (event, api) => {
      api.user.setUserMetadata('pref', 'dark');
    });
    await env.authenticate.signIn({
      email: 'meta@example.com',
      password: 'p',
    });
    const user = await env.users.getByEmail('meta@example.com');
    expect(user?.user_metadata).toMatchObject({ pref: 'dark' });
  });

  it('actions api.access.deny short-circuits signIn with reason', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    await env.authenticate.signUp({
      email: 'deny@example.com',
      password: 'p',
    });
    env.actions.add('post-login', async (event, api) => {
      api.access.deny('user-must-verify-email');
    });
    await expect(
      env.authenticate.signIn({
        email: 'deny@example.com',
        password: 'p',
      }),
    ).rejects.toThrow(/user-must-verify-email/);
  });

  it('signIn with ip forwards to actions event.request.ip', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    await env.authenticate.signUp({
      email: 'ip@example.com',
      password: 'p',
    });
    let capturedIp: string | undefined;
    env.actions.add('post-login', async (event) => {
      capturedIp = event.request.ip;
    });
    await env.authenticate.signIn({
      email: 'ip@example.com',
      password: 'p',
      ip: '203.0.113.42',
    });
    expect(capturedIp).toBe('203.0.113.42');
  });

  it('signIn embeds picture claim in id_token when user has picture set', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    await env.users.create({
      email: 'pic@example.com',
      picture: 'https://example.com/avatar.png',
    });
    await env.authenticate.signUp({
      email: 'pic2@example.com',
      password: 'p',
      user_metadata: {},
    });
    const user = await env.users.getByEmail('pic2@example.com');
    if (user) {
      await env.users.update(user.user_id, {
        picture: 'https://example.com/pic2.png',
      });
    }
    const result = await env.authenticate.signIn({
      email: 'pic2@example.com',
      password: 'p',
    });
    const claims = await env.verifyIdToken(result.id_token);
    expect(claims.picture).toBe('https://example.com/pic2.png');
  });

  it('signIn embeds nickname claim in id_token', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    await env.authenticate.signUp({
      email: 'nick@example.com',
      password: 'p',
    });
    const user = await env.users.getByEmail('nick@example.com');
    if (user) {
      await env.users.update(user.user_id, { nickname: 'nicki' });
    }
    const result = await env.authenticate.signIn({
      email: 'nick@example.com',
      password: 'p',
    });
    const claims = await env.verifyIdToken(result.id_token);
    expect(claims.nickname).toBe('nicki');
  });
});
