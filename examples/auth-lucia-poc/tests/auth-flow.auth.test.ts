import { afterEach, describe, expect, it } from 'vitest';
import { setupLuciaEnv, type LuciaTestEnv } from '@kiwa-lab/auth';
import { createProtectedRoute, type ProtectedProfile } from '../src/route.js';

const envs: LuciaTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function callProtected(
  env: LuciaTestEnv,
  sessionId: string,
): Promise<{ status: number; body: ProtectedProfile | { error: string }; rotated: string | null }> {
  const handler = createProtectedRoute(env);
  const res = await handler(
    new Request('http://kiwa.test/api/me', {
      headers: sessionId ? { 'x-session-id': sessionId } : {},
    }),
  );
  const body = (await res.json()) as ProtectedProfile | { error: string };
  return { status: res.status, body, rotated: res.headers.get('x-session-rotated') };
}

describe('lucia PoC — password auth on sqlite adapter', () => {
  it('T-LUCIA-001 signs up and returns the user profile through the protected route', async () => {
    const env = await setupLuciaEnv();
    envs.push(env);
    const signed = await env.signUpWithPassword({
      email: 'alice@example.test',
      password: 'correct-horse-battery-staple',
    });
    const res = await callProtected(env, signed.session.id);
    expect(res.status).toBe(200);
    expect((res.body as ProtectedProfile).email).toBe('alice@example.test');
  });

  it('T-LUCIA-002 rejects a request without a session id', async () => {
    const env = await setupLuciaEnv();
    envs.push(env);
    const res = await callProtected(env, '');
    expect(res.status).toBe(401);
    expect((res.body as { error: string }).error).toBe('missing session');
  });

  it('T-LUCIA-003 rejects a wrong password without leaking whether the user exists', async () => {
    const env = await setupLuciaEnv();
    envs.push(env);
    await env.signUpWithPassword({ email: 'bob@example.test', password: 'hunter2' });
    await expect(
      env.signInWithPassword({ email: 'bob@example.test', password: 'wrong' }),
    ).rejects.toThrow(/invalid email or password/);
  });
});

describe('lucia PoC — oauth flows', () => {
  it('T-LUCIA-004 google sign-in creates a user and returns a valid session', async () => {
    const env = await setupLuciaEnv();
    envs.push(env);
    const signed = await env.signInWithOAuth('google', {
      sub: 'g-42',
      email: 'carol@example.test',
    });
    const res = await callProtected(env, signed.session.id);
    expect(res.status).toBe(200);
    expect((res.body as ProtectedProfile).email).toBe('carol@example.test');
  });

  it('T-LUCIA-005 github sign-in reuses a password user with the same email', async () => {
    const env = await setupLuciaEnv();
    envs.push(env);
    const pwd = await env.signUpWithPassword({
      email: 'dave@example.test',
      password: 'p1234567',
    });
    const oauth = await env.signInWithOAuth('github', {
      sub: 'gh-7',
      email: 'dave@example.test',
    });
    expect(oauth.user.id).toBe(pwd.user.id);
  });
});

describe('lucia PoC — session lifecycle', () => {
  it('T-LUCIA-006 rolling session expiry rewrites the session id on refresh', async () => {
    const env = await setupLuciaEnv({ sessionExpiration: 100 });
    envs.push(env);
    const signed = await env.signUpWithPassword({ email: 'eve@example.test', password: 'p' });
    // Push the session into the refresh window without waiting on the clock.
    await env.database.updateSession({
      id: signed.session.id,
      expiresAt: new Date(Date.now() + 10 * 1000),
    });
    const res = await callProtected(env, signed.session.id);
    expect(res.status).toBe(200);
    expect(res.rotated).toBe(signed.session.id);
  });

  it('T-LUCIA-007 invalidateSession invalidates the token on the next request', async () => {
    const env = await setupLuciaEnv();
    envs.push(env);
    const signed = await env.signUpWithPassword({ email: 'frank@example.test', password: 'p' });
    const before = await callProtected(env, signed.session.id);
    expect(before.status).toBe(200);
    await env.invalidateSession(signed.session.id);
    const after = await callProtected(env, signed.session.id);
    expect(after.status).toBe(401);
  });
});

describe('lucia PoC — postgresql adapter compat', () => {
  it('T-LUCIA-008 postgresql adapter kind produces the same happy-path shape as sqlite', async () => {
    const env = await setupLuciaEnv({ database: { kind: 'postgresql' } });
    envs.push(env);
    expect(env.database.kind).toBe('postgresql');
    const signed = await env.signInWithOAuth('google', {
      sub: 'g-99',
      email: 'grace@example.test',
    });
    const res = await callProtected(env, signed.session.id);
    expect(res.status).toBe(200);
    expect((res.body as ProtectedProfile).email).toBe('grace@example.test');
  });
});

describe('lucia PoC — session id の取り出し', () => {
  it('T-LUCIA-009 falls back to the query string when the header is absent', async () => {
    const env = await setupLuciaEnv();
    envs.push(env);
    const signed = await env.signUpWithPassword({ email: 'hana@example.test', password: 'p' });
    const handler = createProtectedRoute(env);
    const res = await handler(
      new Request(`http://kiwa.test/api/me?session=${signed.session.id}`),
    );
    expect(res.status).toBe(200);
    expect(((await res.json()) as ProtectedProfile).email).toBe('hana@example.test');
  });

  it('T-LUCIA-010 an empty header hides the query string value', async () => {
    // `??` は null でしか次へ進まない。 header が空文字で存在すると query は読まれない。
    const env = await setupLuciaEnv();
    envs.push(env);
    const signed = await env.signUpWithPassword({ email: 'ian@example.test', password: 'p' });
    const handler = createProtectedRoute(env);
    const res = await handler(
      new Request(`http://kiwa.test/api/me?session=${signed.session.id}`, {
        headers: { 'x-session-id': '' },
      }),
    );
    expect(res.status).toBe(401);
    expect(((await res.json()) as { error: string }).error).toBe('missing session');
  });
});

describe('lucia PoC — 検証の失敗', () => {
  it('T-LUCIA-011 rejects an unknown session id', async () => {
    const env = await setupLuciaEnv();
    envs.push(env);
    const res = await callProtected(env, 'nope');
    expect(res.status).toBe(401);
    expect((res.body as { error: string }).error).toBe('invalid session');
  });

  it('T-LUCIA-012 deletes the row when the session has expired', async () => {
    const env = await setupLuciaEnv({ sessionExpiration: 100 });
    envs.push(env);
    const signed = await env.signUpWithPassword({ email: 'jun@example.test', password: 'p' });
    await env.database.updateSession({
      id: signed.session.id,
      expiresAt: new Date(Date.now() - 1000),
    });
    const res = await callProtected(env, signed.session.id);
    expect(res.status).toBe(401);
    expect((res.body as { error: string }).error).toBe('invalid session');
    // status だけでは削除漏れと区別が付かない。 行が消えたことも確かめる。
    expect(await env.database.getSession(signed.session.id)).toBeNull();
  });
});

describe('lucia PoC — 回転の境界', () => {
  it('T-LUCIA-013 does not rotate a freshly issued session', async () => {
    const env = await setupLuciaEnv();
    envs.push(env);
    const signed = await env.signUpWithPassword({ email: 'kei@example.test', password: 'p' });
    const res = await callProtected(env, signed.session.id);
    expect(res.status).toBe(200);
    expect(res.rotated).toBeNull();
  });

  it('T-LUCIA-014 does not rotate at exactly half the lifetime', async () => {
    // 判定は `remaining < totalMs / 2` の狭義の不等号。 ちょうど半分は延長しない。
    const env = await setupLuciaEnv({ sessionExpiration: 100 });
    envs.push(env);
    const signed = await env.signUpWithPassword({ email: 'leo@example.test', password: 'p' });
    await env.database.updateSession({
      id: signed.session.id,
      expiresAt: new Date(Date.now() + 50 * 1000),
    });
    const res = await callProtected(env, signed.session.id);
    expect(res.status).toBe(200);
    expect(res.rotated).toBeNull();
  });
});

describe('lucia PoC — 引数の検証', () => {
  it('T-LUCIA-015 refuses to build with an empty provider list', async () => {
    await expect(setupLuciaEnv({ providers: [] })).rejects.toThrow(
      /providers must contain at least one entry/,
    );
  });

  it('T-LUCIA-016 refuses a non-positive session lifetime', async () => {
    await expect(setupLuciaEnv({ sessionExpiration: 0 })).rejects.toThrow(
      /sessionExpiration must be a positive number of seconds/,
    );
  });
});
