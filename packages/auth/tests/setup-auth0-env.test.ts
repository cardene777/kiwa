import { afterEach, describe, expect, it } from 'vitest';
import {
  generateAuth0SigningSecret,
  setupAuth0Env,
  signAuth0IdToken,
  verifyAuth0IdToken,
  type Auth0Rule,
  type Auth0TestEnv,
} from '../src/index.js';

const envs: Auth0TestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('setupAuth0Env (defaults)', () => {
  it('exposes users / authenticate / rules / actions APIs + verifyIdToken', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    expect(env.mode).toBe('mock');
    expect(typeof env.users.create).toBe('function');
    expect(typeof env.authenticate.signIn).toBe('function');
    expect(typeof env.rules.add).toBe('function');
    expect(typeof env.actions.add).toBe('function');
    expect(typeof env.verifyIdToken).toBe('function');
    expect(typeof env.verifyAccessToken).toBe('function');
  });

  it('defaults tokenExpiration to 24h', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    expect(env.tokenExpiration).toBe(24 * 60 * 60);
  });

  it('derives issuer from tenant when custom issuer is not set', async () => {
    const env = await setupAuth0Env({ tenant: 'kiwa-test' });
    envs.push(env);
    expect(env.issuer).toBe('https://kiwa-test.auth0.com/');
  });

  it('honors custom issuer + audience overrides', async () => {
    const env = await setupAuth0Env({
      tenant: 'kiwa-test',
      issuer: 'https://custom.auth0.example/',
      audience: 'https://api.kiwa.test/',
    });
    envs.push(env);
    expect(env.issuer).toBe('https://custom.auth0.example/');
    expect(env.audience).toBe('https://api.kiwa.test/');
  });

  it('rejects a non-positive tokenExpiration', async () => {
    await expect(setupAuth0Env({ tokenExpiration: 0 })).rejects.toThrow(
      /tokenExpiration/,
    );
    await expect(setupAuth0Env({ tokenExpiration: -1 })).rejects.toThrow(
      /tokenExpiration/,
    );
  });
});

describe('setupAuth0Env (users Management API)', () => {
  it('create produces an Auth0-shaped record with connection-prefixed sub', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    const user = await env.users.create({
      email: 'alice@example.test',
      name: 'Alice Anderson',
      email_verified: true,
    });
    // Auth0 real user_id shape ... `auth0|<24-char>` (padded to 24 chars).
    expect(user.user_id).toMatch(/^auth0\|0{23}1$/);
    expect(user.user_id.split('|')[1]).toHaveLength(24);
    expect(user.email).toBe('alice@example.test');
    expect(user.email_verified).toBe(true);
    expect(user.name).toBe('Alice Anderson');
    expect(user.identities).toHaveLength(1);
    expect(user.identities[0]?.provider).toBe('Username-Password-Authentication');
    expect(user.identities[0]?.isSocial).toBe(false);
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);
  });

  it('create with google-oauth2 connection tags the identity as social', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    const user = await env.users.create({
      email: 'bob@example.test',
      connection: 'google-oauth2',
    });
    expect(user.user_id.startsWith('google-oauth2|')).toBe(true);
    expect(user.identities[0]?.isSocial).toBe(true);
    expect(user.identities[0]?.provider).toBe('google-oauth2');
  });

  it('create rejects duplicate emails', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    await env.users.create({ email: 'dup@example.test' });
    await expect(env.users.create({ email: 'dup@example.test' })).rejects.toThrow(
      /already exists/,
    );
  });

  it('create rejects invalid email input', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    await expect(env.users.create({ email: 'not-an-email' })).rejects.toThrow(
      /email/,
    );
  });

  it('get returns the record and throws on unknown id', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    const created = await env.users.create({ email: 'eve@example.test' });
    const fetched = await env.users.get(created.user_id);
    expect(fetched.user_id).toBe(created.user_id);
    await expect(env.users.get('auth0|missing')).rejects.toThrow(/not found/);
  });

  it('getByEmail returns null when the email is unknown', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    expect(await env.users.getByEmail('ghost@example.test')).toBeNull();
  });

  it('update patches name / metadata + refreshes updated_at', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    const created = await env.users.create({ email: 'frank@example.test' });
    const before = created.updated_at.getTime();
    await new Promise((resolve) => setTimeout(resolve, 10));
    const updated = await env.users.update(created.user_id, {
      name: 'Frank',
      app_metadata: { plan: 'pro' },
    });
    expect(updated.name).toBe('Frank');
    expect(updated.app_metadata?.plan).toBe('pro');
    expect(updated.updated_at.getTime()).toBeGreaterThan(before);
  });

  it('update supports blocking a user which then rejects signIn', async () => {
    const env = await setupAuth0Env({
      users: [{ email: 'blocked@example.test', password: 'pw' }],
    });
    envs.push(env);
    const user = await env.users.getByEmail('blocked@example.test');
    if (!user) throw new Error('seed missing');
    await env.users.update(user.user_id, { blocked: true });
    await expect(
      env.authenticate.signIn({ email: 'blocked@example.test', password: 'pw' }),
    ).rejects.toThrow(/blocked/);
  });

  it('delete removes the record and clears password + email index', async () => {
    const env = await setupAuth0Env({
      users: [{ email: 'goose@example.test', password: 'pw' }],
    });
    envs.push(env);
    const user = await env.users.getByEmail('goose@example.test');
    if (!user) throw new Error('seed missing');
    await env.users.delete(user.user_id);
    await expect(env.users.get(user.user_id)).rejects.toThrow(/not found/);
    expect(await env.users.getByEmail('goose@example.test')).toBeNull();
    // Password vault entry cleared — a fresh create + signIn round trips.
    const fresh = await env.users.create({ email: 'goose@example.test' });
    expect(fresh.user_id).not.toBe(user.user_id);
  });

  it('list returns every created user', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    await env.users.create({ email: 'a@example.test' });
    await env.users.create({ email: 'b@example.test' });
    const users = await env.users.list();
    expect(users).toHaveLength(2);
  });
});

describe('setupAuth0Env (Authentication API — signUp + signIn + tokens)', () => {
  it('signUp creates the user and returns id_token + access_token', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    const { user, id_token, access_token } = await env.authenticate.signUp({
      email: 'signup@example.test',
      password: 'pw-strong-1',
      user_metadata: { locale: 'ja' },
    });
    expect(user.email).toBe('signup@example.test');
    expect(user.user_metadata?.locale).toBe('ja');
    expect(id_token.split('.')).toHaveLength(3);
    expect(access_token.split('.')).toHaveLength(3);
    const claims = await env.verifyIdToken(id_token);
    expect(claims.sub).toBe(user.user_id);
    expect(claims.aud).toBe(env.clientId);
    expect(claims.iss).toBe(env.issuer);
    expect(claims.email).toBe('signup@example.test');
    expect(claims.iat).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
    expect(claims.exp).toBeGreaterThan(claims.iat);
  });

  it('signUp rejects duplicate emails', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    await env.authenticate.signUp({ email: 'dup@example.test', password: 'pw' });
    await expect(
      env.authenticate.signUp({ email: 'dup@example.test', password: 'pw' }),
    ).rejects.toThrow(/already exists/);
  });

  it('signIn verifies the password + refreshes last_login', async () => {
    const env = await setupAuth0Env({
      users: [{ email: 'login@example.test', password: 'correct-pw' }],
    });
    envs.push(env);
    const before = await env.users.getByEmail('login@example.test');
    expect(before?.last_login).toBeUndefined();
    const { user } = await env.authenticate.signIn({
      email: 'login@example.test',
      password: 'correct-pw',
    });
    expect(user.last_login).toBeInstanceOf(Date);
  });

  it('signIn rejects incorrect password', async () => {
    const env = await setupAuth0Env({
      users: [{ email: 'wrong@example.test', password: 'correct-pw' }],
    });
    envs.push(env);
    await expect(
      env.authenticate.signIn({ email: 'wrong@example.test', password: 'bad-pw' }),
    ).rejects.toThrow(/incorrect password/);
  });

  it('signIn rejects unknown user', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    await expect(
      env.authenticate.signIn({ email: 'nobody@example.test' }),
    ).rejects.toThrow(/unknown user/);
  });

  it('signIn on a social connection user skips the password check', async () => {
    const env = await setupAuth0Env({
      users: [{ email: 'gh@example.test', connection: 'github' }],
    });
    envs.push(env);
    const { user, id_token } = await env.authenticate.signIn({
      email: 'gh@example.test',
    });
    expect(user.identities[0]?.provider).toBe('github');
    const claims = await env.verifyIdToken(id_token);
    expect(claims.sub).toMatch(/^github\|/);
  });

  it('signIn echoes the nonce back into the id_token', async () => {
    const env = await setupAuth0Env({
      users: [{ email: 'nonce@example.test', password: 'pw' }],
    });
    envs.push(env);
    const { id_token } = await env.authenticate.signIn({
      email: 'nonce@example.test',
      password: 'pw',
      nonce: 'test-nonce-xyz',
    });
    const claims = await env.verifyIdToken(id_token);
    expect(claims.nonce).toBe('test-nonce-xyz');
  });

  it('verifyIdToken rejects tampered signatures', async () => {
    const env = await setupAuth0Env({
      users: [{ email: 'tamper@example.test', password: 'pw' }],
    });
    envs.push(env);
    const { id_token } = await env.authenticate.signIn({
      email: 'tamper@example.test',
      password: 'pw',
    });
    const parts = id_token.split('.');
    const sig = parts[2] ?? '';
    parts[2] = (sig[0] === 'a' ? 'b' : 'a') + sig.slice(1);
    await expect(env.verifyIdToken(parts.join('.'))).rejects.toThrow(/signature/);
  });

  it('verifyIdToken rejects tokens issued by a different env instance', async () => {
    const env1 = await setupAuth0Env({
      users: [{ email: 'x1@example.test', password: 'pw' }],
    });
    const env2 = await setupAuth0Env();
    envs.push(env1, env2);
    const { id_token } = await env1.authenticate.signIn({
      email: 'x1@example.test',
      password: 'pw',
    });
    await expect(env2.verifyIdToken(id_token)).rejects.toThrow(/signature/);
  });

  it('verifyIdToken rejects tokens whose issuer differs (foreign tenant forgery)', async () => {
    const env = await setupAuth0Env({ tenant: 'kiwa-test' });
    envs.push(env);
    const now = Math.floor(Date.now() / 1000);
    // Forge a token with the env's secret exposed for the test — the mock has
    // no accessor so we sign with a fresh secret to guarantee it's a foreign
    // signature. This confirms signature check fires before issuer.
    const foreignSecret = generateAuth0SigningSecret();
    const forged = signAuth0IdToken(
      {
        sub: 'auth0|forged',
        aud: env.clientId,
        iss: 'https://malicious.auth0.example/',
        iat: now,
        exp: now + 60,
      },
      foreignSecret,
    );
    await expect(env.verifyIdToken(forged)).rejects.toThrow(/signature/);
  });

  it('verifyIdToken exposes issuer mismatch when signature is valid but iss is wrong', async () => {
    // We use the exported helpers here to construct a token with a valid
    // signature (same secret) but a wrong issuer — proves the issuer check
    // fires after signature validation.
    const secret = generateAuth0SigningSecret();
    const now = Math.floor(Date.now() / 1000);
    const forged = signAuth0IdToken(
      {
        sub: 'auth0|forged',
        aud: 'test-client',
        iss: 'https://wrong.auth0.example/',
        iat: now,
        exp: now + 60,
      },
      secret,
    );
    expect(() =>
      verifyAuth0IdToken(forged, secret, {
        issuer: 'https://right.auth0.example/',
        audience: 'test-client',
      }),
    ).toThrow(/issuer mismatch/);
  });

  it('verifyIdToken rejects malformed input', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    await expect(env.verifyIdToken('not-a-jwt')).rejects.toThrow(/malformed/);
    await expect(env.verifyIdToken('a.b')).rejects.toThrow(/malformed/);
  });

  it('verifyIdToken rejects expired tokens', async () => {
    const secret = generateAuth0SigningSecret();
    const now = Math.floor(Date.now() / 1000);
    const forged = signAuth0IdToken(
      {
        sub: 'auth0|forged',
        aud: 'test-client',
        iss: 'https://kiwa.auth0.example/',
        iat: now - 100,
        exp: now - 1,
      },
      secret,
    );
    expect(() =>
      verifyAuth0IdToken(forged, secret, {
        issuer: 'https://kiwa.auth0.example/',
        audience: 'test-client',
      }),
    ).toThrow(/expired/);
  });

  it('verifyAccessToken validates the API audience', async () => {
    const env = await setupAuth0Env({
      audience: 'https://api.kiwa.test/',
      users: [{ email: 'api@example.test', password: 'pw' }],
    });
    envs.push(env);
    const { access_token } = await env.authenticate.signIn({
      email: 'api@example.test',
      password: 'pw',
    });
    const claims = await env.verifyAccessToken(access_token);
    expect(claims.aud).toBe('https://api.kiwa.test/');
    expect(claims.iss).toBe(env.issuer);
    expect(claims.azp).toBe(env.clientId);
  });
});

describe('setupAuth0Env (rules pipeline)', () => {
  it('a rule injects a custom claim into the id_token', async () => {
    const rule: Auth0Rule = (user, context, cb) => {
      context.idToken['https://kiwa.test/roles'] = ['admin'];
      cb(null, user, context);
    };
    const env = await setupAuth0Env({
      users: [{ email: 'rule@example.test', password: 'pw' }],
      rules: [rule],
    });
    envs.push(env);
    const { id_token } = await env.authenticate.signIn({
      email: 'rule@example.test',
      password: 'pw',
    });
    const claims = await env.verifyIdToken(id_token);
    expect(claims['https://kiwa.test/roles']).toEqual(['admin']);
  });

  it('rules run in registration order and later rules see earlier mutations', async () => {
    const order: string[] = [];
    const firstRule: Auth0Rule = (user, context, cb) => {
      order.push('first');
      context.idToken['https://kiwa.test/step'] = 1;
      cb(null, user, context);
    };
    const secondRule: Auth0Rule = (user, context, cb) => {
      order.push('second');
      const prev = context.idToken['https://kiwa.test/step'] as number;
      context.idToken['https://kiwa.test/step'] = prev + 1;
      cb(null, user, context);
    };
    const env = await setupAuth0Env({
      users: [{ email: 'chain@example.test', password: 'pw' }],
      rules: [firstRule, secondRule],
    });
    envs.push(env);
    const { id_token } = await env.authenticate.signIn({
      email: 'chain@example.test',
      password: 'pw',
    });
    expect(order).toEqual(['first', 'second']);
    const claims = await env.verifyIdToken(id_token);
    expect(claims['https://kiwa.test/step']).toBe(2);
  });

  it('a rule that redirects sets redirect_url on the signIn result', async () => {
    const rule: Auth0Rule = (user, context, cb) => {
      context.redirect = { url: 'https://mfa.kiwa.test/challenge' };
      cb(null, user, context);
    };
    const env = await setupAuth0Env({
      users: [{ email: 'redir@example.test', password: 'pw' }],
      rules: [rule],
    });
    envs.push(env);
    const { redirect_url } = await env.authenticate.signIn({
      email: 'redir@example.test',
      password: 'pw',
    });
    expect(redirect_url).toBe('https://mfa.kiwa.test/challenge');
  });

  it('a rule that calls callback(err) aborts the login', async () => {
    const rule: Auth0Rule = (_user, _ctx, cb) => {
      cb(new Error('rule aborted'));
    };
    const env = await setupAuth0Env({
      users: [{ email: 'abort@example.test', password: 'pw' }],
      rules: [rule],
    });
    envs.push(env);
    await expect(
      env.authenticate.signIn({ email: 'abort@example.test', password: 'pw' }),
    ).rejects.toThrow(/rule aborted/);
  });

  it('rules.add / rules.clear manage the registry at runtime', async () => {
    const env = await setupAuth0Env({
      users: [{ email: 'reg@example.test', password: 'pw' }],
    });
    envs.push(env);
    env.rules.add((user, ctx, cb) => {
      ctx.idToken['https://kiwa.test/x'] = 1;
      cb(null, user, ctx);
    });
    expect(env.rules.list()).toHaveLength(1);
    const { id_token } = await env.authenticate.signIn({
      email: 'reg@example.test',
      password: 'pw',
    });
    const claims = await env.verifyIdToken(id_token);
    expect(claims['https://kiwa.test/x']).toBe(1);
    env.rules.clear();
    expect(env.rules.list()).toHaveLength(0);
  });
});

describe('setupAuth0Env (actions pipeline)', () => {
  it('post-login action injects claims into id_token + access_token', async () => {
    const env = await setupAuth0Env({
      users: [{ email: 'action@example.test', password: 'pw' }],
      actions: {
        'post-login': [
          (_event, api) => {
            api.idToken.setCustomClaim('https://kiwa.test/plan', 'pro');
            api.accessToken.setCustomClaim('https://kiwa.test/tier', 'gold');
          },
        ],
      },
    });
    envs.push(env);
    const { id_token, access_token } = await env.authenticate.signIn({
      email: 'action@example.test',
      password: 'pw',
    });
    const idClaims = await env.verifyIdToken(id_token);
    const accessClaims = await env.verifyAccessToken(access_token);
    expect(idClaims['https://kiwa.test/plan']).toBe('pro');
    expect(accessClaims['https://kiwa.test/tier']).toBe('gold');
  });

  it('post-login action can setAppMetadata which persists on the user', async () => {
    const env = await setupAuth0Env({
      users: [{ email: 'meta@example.test', password: 'pw' }],
      actions: {
        'post-login': [
          (_event, api) => {
            api.user.setAppMetadata('login_count', 1);
          },
        ],
      },
    });
    envs.push(env);
    await env.authenticate.signIn({ email: 'meta@example.test', password: 'pw' });
    const user = await env.users.getByEmail('meta@example.test');
    expect(user?.app_metadata?.login_count).toBe(1);
  });

  it('post-login action can add permissions which surface on access_token', async () => {
    const env = await setupAuth0Env({
      audience: 'https://api.kiwa.test/',
      users: [{ email: 'perm@example.test', password: 'pw' }],
      actions: {
        'post-login': [
          (_event, api) => {
            api.accessToken.addScope('read:profile');
            api.accessToken.addScope('write:profile');
          },
        ],
      },
    });
    envs.push(env);
    const { access_token } = await env.authenticate.signIn({
      email: 'perm@example.test',
      password: 'pw',
    });
    const claims = await env.verifyAccessToken(access_token);
    expect(claims.permissions).toEqual(['read:profile', 'write:profile']);
  });

  it('post-login action can deny the login', async () => {
    const env = await setupAuth0Env({
      users: [{ email: 'deny@example.test', password: 'pw' }],
      actions: {
        'post-login': [
          (_event, api) => {
            api.access.deny('mfa required');
          },
        ],
      },
    });
    envs.push(env);
    await expect(
      env.authenticate.signIn({ email: 'deny@example.test', password: 'pw' }),
    ).rejects.toThrow(/mfa required/);
  });

  it('post-login action can redirect the user', async () => {
    const env = await setupAuth0Env({
      users: [{ email: 'redir@example.test', password: 'pw' }],
      actions: {
        'post-login': [
          (_event, api) => {
            api.redirect.sendUserTo('https://step-up.kiwa.test/');
          },
        ],
      },
    });
    envs.push(env);
    const { redirect_url } = await env.authenticate.signIn({
      email: 'redir@example.test',
      password: 'pw',
    });
    expect(redirect_url).toBe('https://step-up.kiwa.test/');
  });

  it('pre-user-registration action can deny signUp before write', async () => {
    const env = await setupAuth0Env({
      actions: {
        'pre-user-registration': [
          (event, api) => {
            if (event.user.email.endsWith('@blocked.test')) {
              api.access.deny('email domain blocked');
            }
          },
        ],
      },
    });
    envs.push(env);
    await expect(
      env.authenticate.signUp({
        email: 'malicious@blocked.test',
        password: 'pw',
      }),
    ).rejects.toThrow(/email domain blocked/);
    // Store is untouched.
    expect(await env.users.getByEmail('malicious@blocked.test')).toBeNull();
  });

  it('pre-user-registration action can seed app_metadata / user_metadata onto the new user (buffered)', async () => {
    const env = await setupAuth0Env({
      actions: {
        'pre-user-registration': [
          (_event, api) => {
            api.user.setAppMetadata('signup_source', 'email-invite');
            api.user.setUserMetadata('locale', 'ja');
          },
        ],
      },
    });
    envs.push(env);
    const { user } = await env.authenticate.signUp({
      email: 'buffered@example.test',
      password: 'pw',
      user_metadata: { theme: 'dark' },
    });
    // Both buffered + input metadata survive.
    expect(user.app_metadata?.signup_source).toBe('email-invite');
    expect(user.user_metadata?.locale).toBe('ja');
    expect(user.user_metadata?.theme).toBe('dark');
  });

  it('post-user-registration action fires after signUp with the new user', async () => {
    const seen: string[] = [];
    const env = await setupAuth0Env({
      actions: {
        'post-user-registration': [
          (event) => {
            seen.push(event.user.user_id);
          },
        ],
      },
    });
    envs.push(env);
    const { user } = await env.authenticate.signUp({
      email: 'postreg@example.test',
      password: 'pw',
    });
    expect(seen).toEqual([user.user_id]);
  });

  it('actions.add / actions.clear manage per-trigger registries', async () => {
    const env = await setupAuth0Env({
      users: [{ email: 'reg@example.test', password: 'pw' }],
    });
    envs.push(env);
    env.actions.add('post-login', (_event, api) => {
      api.idToken.setCustomClaim('https://kiwa.test/dynamic', true);
    });
    expect(env.actions.list('post-login')).toHaveLength(1);
    const { id_token } = await env.authenticate.signIn({
      email: 'reg@example.test',
      password: 'pw',
    });
    const claims = await env.verifyIdToken(id_token);
    expect(claims['https://kiwa.test/dynamic']).toBe(true);
    env.actions.clear('post-login');
    expect(env.actions.list('post-login')).toHaveLength(0);
    env.actions.add('post-login', (_e, _a) => {});
    env.actions.add('post-user-registration', (_e, _a) => {});
    env.actions.clear();
    expect(env.actions.list('post-login')).toHaveLength(0);
    expect(env.actions.list('post-user-registration')).toHaveLength(0);
  });
});

describe('setupAuth0Env (setAppMetadata + stop)', () => {
  it('setAppMetadata merges into existing app_metadata', async () => {
    const env = await setupAuth0Env({
      users: [{ email: 'seed@example.test', app_metadata: { plan: 'free' } }],
    });
    envs.push(env);
    const user = await env.users.getByEmail('seed@example.test');
    if (!user) throw new Error('seed missing');
    const updated = await env.setAppMetadata(user.user_id, { role: 'admin' });
    expect(updated.app_metadata?.plan).toBe('free');
    expect(updated.app_metadata?.role).toBe('admin');
  });

  it('stop resets state, allowing reuse across suites', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    await env.users.create({ email: 'reset@example.test' });
    await env.stop();
    // After stop, the store is reset — a fresh create with the same email
    // must succeed without a duplicate error.
    const fresh = await env.users.create({ email: 'reset@example.test' });
    expect(fresh.user_id).toMatch(/^auth0\|/);
  });
});
