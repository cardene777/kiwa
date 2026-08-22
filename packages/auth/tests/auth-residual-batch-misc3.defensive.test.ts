import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  hashPassword as hashLuciaPassword,
  hashBetterAuthPassword,
  setupAuth0Env,
  verifyPassword as verifyLuciaPassword,
  verifyBetterAuthPassword,
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
  const env = await setupAuth0Env({ tenant: 'kiwa-test' });
  envs.push(env);
  return env;
}

describe('auth0 env — app_metadata の直接更新', () => {
  it('app_metadata を持たない利用者にも patch を積める', async () => {
    const env = await makeEnv();
    const user = await env.users.create({ email: 'meta@example.com' });
    expect(user.app_metadata).toBeUndefined();

    const updated = await env.setAppMetadata(user.user_id, { plan: 'pro' });

    // 既存が無い場合に空 object から始めないと spread が落ちる。
    expect(updated.app_metadata).toEqual({ plan: 'pro' });

    const merged = await env.setAppMetadata(user.user_id, { seats: 3 });
    // 2 回目は上書きではなく併合。
    expect(merged.app_metadata).toEqual({ plan: 'pro', seats: 3 });
  });

  it('未知 user id への app_metadata 更新は id 付きで拒否する', async () => {
    const env = await makeEnv();

    await expect(env.setAppMetadata('auth0|missing', { plan: 'pro' })).rejects.toThrow(
      'Auth0 setAppMetadata: unknown user id auth0|missing',
    );
  });
});

describe('auth0 env — id_token の任意 claim と action の打ち切り', () => {
  it('name を持つ利用者は id_token に name claim が載る', async () => {
    const env = await makeEnv();
    // signUp が password を金庫に入れる。 users.create だけだと signIn できない。
    const created = await env.authenticate.signUp({
      email: 'named@example.com',
      password: 'pw-1',
    });
    await env.users.update(created.user.user_id, {
      name: 'Kiwa Tester',
      nickname: 'kiwa',
    });

    const { id_token } = await env.authenticate.signIn({
      email: 'named@example.com',
      password: 'pw-1',
    });
    const claims = await env.verifyIdToken(id_token);

    expect(claims.name).toBe('Kiwa Tester');
    expect(claims.nickname).toBe('kiwa');
  });

  it('deny した action の後続は実行しない', async () => {
    const env = await makeEnv();
    await env.authenticate.signUp({ email: 'denied@example.com', password: 'pw-1' });
    const second = vi.fn();
    env.actions.add('post-login', (_event, api) => {
      api.access.deny('risk score too high');
    });
    env.actions.add('post-login', second);

    await expect(
      env.authenticate.signIn({ email: 'denied@example.com', password: 'pw-1' }),
    ).rejects.toThrow('Auth0 authenticate.signIn: access denied — risk score too high');
    // 拒否が確定した後も走らせると、 拒否したはずの login で claim 追加や
    // metadata 書込みが起きる。
    expect(second).not.toHaveBeenCalled();
  });
});

describe('password 検証 — 長さの違う digest', () => {
  function swapDigest(hash: string, digest: string): string {
    const idx = hash.lastIndexOf('$');
    return `${hash.slice(0, idx + 1)}${digest}`;
  }

  it('lucia 版は digest の長さが合わなければ比較せず false を返す', async () => {
    const valid = await hashLuciaPassword('pw-1');

    // timingSafeEqual は長さ違いで throw する。 手前で弾かないと
    // 壊れた hash が例外になり、 sign-in が 500 に化ける。
    expect(await verifyLuciaPassword(swapDigest(valid, 'AAAA'), 'pw-1')).toBe(false);
    expect(await verifyLuciaPassword(valid, 'pw-1')).toBe(true);
  });

  it('better-auth 版も digest の長さ違いを false にする', async () => {
    const valid = await hashBetterAuthPassword('pw-1');

    expect(await verifyBetterAuthPassword(swapDigest(valid, 'AAAA'), 'pw-1')).toBe(false);
    expect(await verifyBetterAuthPassword(valid, 'pw-1')).toBe(true);
  });
});
