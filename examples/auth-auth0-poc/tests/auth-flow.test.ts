import { afterEach, describe, expect, it } from 'vitest';
import { setupAuth0Env, type Auth0TestEnv } from '@kiwa-test/auth';
import {
  createAdminRoute,
  createProtectedRoute,
  type ProtectedProfile,
} from '../src/route.js';

const envs: Auth0TestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function callProtected(
  env: Auth0TestEnv,
  token: string,
): Promise<{ status: number; body: ProtectedProfile | { error: string; reason?: string } }> {
  const handler = createProtectedRoute(env);
  const res = await handler(
    new Request('http://kiwa.test/api/me', {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    }),
  );
  const body = (await res.json()) as ProtectedProfile | { error: string; reason?: string };
  return { status: res.status, body };
}

async function callAdmin(
  env: Auth0TestEnv,
  token: string,
): Promise<{ status: number; body: ProtectedProfile | { error: string } }> {
  const handler = createAdminRoute(env);
  const res = await handler(
    new Request('http://kiwa.test/api/admin', {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    }),
  );
  const body = (await res.json()) as ProtectedProfile | { error: string };
  return { status: res.status, body };
}

describe('auth0 PoC — token verification', () => {
  it('T-A0-001 valid Auth0 access_token unlocks the protected route with user profile', async () => {
    const env = await setupAuth0Env({
      audience: 'https://api.kiwa.test/',
      users: [
        { email: 'alice@auth0.test', password: 'pw-1', name: 'Alice Anderson' },
      ],
    });
    envs.push(env);
    const { access_token } = await env.authenticate.signIn({
      email: 'alice@auth0.test',
      password: 'pw-1',
    });
    const res = await callProtected(env, access_token);
    expect(res.status).toBe(200);
    const body = res.body as ProtectedProfile;
    expect(body.email).toBe('alice@auth0.test');
    expect(body.userId).toMatch(/^auth0\|/);
  });

  it('T-A0-002 missing Authorization header returns 401', async () => {
    const env = await setupAuth0Env();
    envs.push(env);
    const res = await callProtected(env, '');
    expect(res.status).toBe(401);
    expect((res.body as { error: string }).error).toBe('missing token');
  });

  it('T-A0-003 tampered access_token signature returns 401 with reason', async () => {
    const env = await setupAuth0Env({
      audience: 'https://api.kiwa.test/',
      users: [{ email: 'bob@auth0.test', password: 'pw' }],
    });
    envs.push(env);
    const { access_token } = await env.authenticate.signIn({
      email: 'bob@auth0.test',
      password: 'pw',
    });
    const parts = access_token.split('.');
    const sig = parts[2] ?? '';
    parts[2] = (sig[0] === 'a' ? 'b' : 'a') + sig.slice(1);
    const res = await callProtected(env, parts.join('.'));
    expect(res.status).toBe(401);
    const body = res.body as { error: string; reason?: string };
    expect(body.error).toBe('invalid token');
    expect(body.reason).toMatch(/signature/);
  });

  it('T-A0-004 access_token issued by a different tenant is rejected', async () => {
    const env1 = await setupAuth0Env({
      tenant: 'kiwa-a',
      audience: 'https://api.kiwa.test/',
      users: [{ email: 'carol@auth0.test', password: 'pw' }],
    });
    const env2 = await setupAuth0Env({
      tenant: 'kiwa-b',
      audience: 'https://api.kiwa.test/',
    });
    envs.push(env1, env2);
    const { access_token } = await env1.authenticate.signIn({
      email: 'carol@auth0.test',
      password: 'pw',
    });
    // env2 does not know env1's signing key — verification fails.
    const res = await callProtected(env2, access_token);
    expect(res.status).toBe(401);
  });
});

describe('auth0 PoC — rules + actions pipeline', () => {
  it('T-A0-005 post-login action injects role claim which the protected route surfaces', async () => {
    const env = await setupAuth0Env({
      audience: 'https://api.kiwa.test/',
      users: [{ email: 'dave@auth0.test', password: 'pw', app_metadata: { role: 'admin' } }],
      actions: {
        'post-login': [
          (event, api) => {
            const role = event.user.app_metadata?.role;
            if (role) {
              api.accessToken.setCustomClaim('https://kiwa.test/roles', [role]);
            }
          },
        ],
      },
    });
    envs.push(env);
    const { access_token } = await env.authenticate.signIn({
      email: 'dave@auth0.test',
      password: 'pw',
    });
    const res = await callProtected(env, access_token);
    expect(res.status).toBe(200);
    const body = res.body as ProtectedProfile;
    expect(body.roles).toEqual(['admin']);
  });

  it('T-A0-006 admin route rejects a non-admin caller with 403', async () => {
    const env = await setupAuth0Env({
      audience: 'https://api.kiwa.test/',
      users: [
        { email: 'eve-admin@auth0.test', password: 'pw', app_metadata: { role: 'admin' } },
        { email: 'eve-member@auth0.test', password: 'pw', app_metadata: { role: 'member' } },
      ],
      actions: {
        'post-login': [
          (event, api) => {
            const role = event.user.app_metadata?.role;
            if (role) {
              api.accessToken.setCustomClaim('https://kiwa.test/roles', [role]);
            }
          },
        ],
      },
    });
    envs.push(env);
    const memberToken = await env.authenticate.signIn({
      email: 'eve-member@auth0.test',
      password: 'pw',
    });
    const res = await callAdmin(env, memberToken.access_token);
    expect(res.status).toBe(403);
    expect((res.body as { error: string }).error).toBe('forbidden');
  });

  it('T-A0-007 rules pipeline mutates id_token and post-login action mutates access_token in the same login', async () => {
    const env = await setupAuth0Env({
      audience: 'https://api.kiwa.test/',
      users: [{ email: 'frank@auth0.test', password: 'pw' }],
      rules: [
        (user, ctx, cb) => {
          ctx.idToken['https://kiwa.test/tier'] = 'gold';
          cb(null, user, ctx);
        },
      ],
      actions: {
        'post-login': [
          (_event, api) => {
            api.accessToken.addScope('read:profile');
          },
        ],
      },
    });
    envs.push(env);
    const { id_token, access_token } = await env.authenticate.signIn({
      email: 'frank@auth0.test',
      password: 'pw',
    });
    const idClaims = await env.verifyIdToken(id_token);
    expect(idClaims['https://kiwa.test/tier']).toBe('gold');
    const accessClaims = await env.verifyAccessToken(access_token);
    expect(accessClaims.permissions).toEqual(['read:profile']);
  });
});

describe('auth0 PoC — Management API + lifecycle', () => {
  it('T-A0-008 signUp then signIn round trip produces a token accepted by the protected route', async () => {
    const env = await setupAuth0Env({
      audience: 'https://api.kiwa.test/',
    });
    envs.push(env);
    await env.authenticate.signUp({
      email: 'signup@auth0.test',
      password: 'pw-signup',
      user_metadata: { locale: 'ja' },
    });
    const { access_token, user } = await env.authenticate.signIn({
      email: 'signup@auth0.test',
      password: 'pw-signup',
    });
    const res = await callProtected(env, access_token);
    expect(res.status).toBe(200);
    const body = res.body as ProtectedProfile;
    expect(body.email).toBe('signup@auth0.test');
    expect(user.user_metadata?.locale).toBe('ja');
  });
});
