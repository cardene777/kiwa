import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  __resetPasskeyCounters,
  createInMemoryAdapter,
  createInMemoryBetterAuthAdapter,
  createInMemoryLuciaAdapter,
  hashPassword as hashLuciaPassword,
  hashBetterAuthPassword,
  setupPasskeyEnv,
  setupSupabaseAuthEnv,
  verifyPassword as verifyLuciaPassword,
  verifyBetterAuthPassword,
  type PasskeyTestEnv,
} from '../src/index.js';
import { credentialAssertion } from '../src/webauthn/assertion.js';
import { createPlatformAuthenticator } from '../src/passkey/platform.js';
import type { SupabaseAuthTestEnv } from '../src/supabase/types.js';
import type { WebAuthnCredential } from '../src/webauthn/types.js';

const passkeyEnvs: PasskeyTestEnv[] = [];
const supabaseEnvs: SupabaseAuthTestEnv[] = [];

beforeEach(() => {
  __resetPasskeyCounters();
});

afterEach(async () => {
  while (passkeyEnvs.length > 0) {
    const env = passkeyEnvs.pop();
    if (env) await env.stop();
  }
  while (supabaseEnvs.length > 0) {
    const env = supabaseEnvs.pop();
    if (env) await env.stop();
  }
});

describe('credentialCreation — excludeCredentials に一致が無い場合', () => {
  it('未登録 id だけの exclude list は発行を止めない', async () => {
    const env = await setupPasskeyEnv({
      devices: [{ deviceId: 'macbook-1', platform: { biometric: 'touch-id' } }],
    });
    passkeyEnvs.push(env);

    const response = await env.createPasskey('macbook-1', 'user-1', {
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'n', displayName: 'd' },
      challenge: 'challenge-exclude',
      // 「この端末に既にある鍵」 を RP が列挙する場面。 1 件も一致しないなら
      // 登録は続行されなければならない (常に拒否すると再登録が不可能になる)。
      excludeCredentials: [{ id: 'credential-not-registered', type: 'public-key' }],
    });

    expect(response.credentialId).toBeTruthy();
    expect(env.getPasskey(response.credentialId)).not.toBeNull();
  });
});

describe('credentialAssertion — 所有者が記録されていない credential', () => {
  it('ownership 台帳に無い credential は候補から外す', () => {
    const { handle } = createPlatformAuthenticator({ biometric: 'touch-id' });
    const credential: WebAuthnCredential = {
      credentialId: 'credential-orphan',
      userHandle: 'user-1',
      publicKey: 'pk',
      signCount: 0,
      transports: ['internal'],
      attachment: 'platform',
      discoverable: true,
      createdAt: Date.now(),
    };
    const registry = new Map<string, WebAuthnCredential>([[credential.credentialId, credential]]);

    // ownership が空 = どの authenticator が署名すべきか決まらない。
    // 適当な authenticator で署名させると、 別端末の鍵で assertion が通る。
    expect(() =>
      credentialAssertion(
        { rpId: 'example.test', challenge: 'assert-1' },
        registry,
        [handle],
        new Map<string, string>(),
      ),
    ).toThrow();
  });
});

describe('supabase auth env — identity と metadata の残り既定値', () => {
  it('email identity は email も phone も無ければ userId を identityId にする', async () => {
    const env = await setupSupabaseAuthEnv({
      users: [{ identities: [{ provider: 'email' }] }],
    });
    supabaseEnvs.push(env);

    const [user] = await env.admin.listUsers();

    // 空文字を入れると別利用者の identity と衝突しうるので userId に落とす。
    expect(user?.identities?.[0]?.identityId).toBe(user?.id);
  });

  it('appMetadata を明示すると identity 由来の既定値を上書きする', async () => {
    const env = await setupSupabaseAuthEnv();
    supabaseEnvs.push(env);

    const user = await env.admin.createUser({
      email: 'meta@example.test',
      appMetadata: { provider: 'custom', tier: 'gold' },
    });

    expect(user.appMetadata).toEqual({ provider: 'custom', tier: 'gold' });
  });

  it('signUp の options.data は userMetadata に載る', async () => {
    const env = await setupSupabaseAuthEnv();
    supabaseEnvs.push(env);

    const { user } = await env.auth.signUp({
      email: 'signup@example.test',
      password: 'pw-1',
      options: { data: { nickname: 'kiwa' } },
    });

    expect(user.userMetadata).toEqual({ nickname: 'kiwa' });
  });
});

describe('password 検証 — 区切りの数が合わない hash', () => {
  it('lucia 版は salt / hash 以外の区切りが増えた hash を false にする', async () => {
    const valid = await hashLuciaPassword('pw-1');

    // `$salt$hash` の 2 分割が前提。 3 分割以上を通すと、 末尾を無視して
    // 前半だけで照合する実装に化けうる。
    expect(await verifyLuciaPassword(`${valid}$extra`, 'pw-1')).toBe(false);
    expect(await verifyLuciaPassword(valid, 'pw-1')).toBe(true);
  });

  it('better-auth 版も区切り超過の hash を false にする', async () => {
    const valid = await hashBetterAuthPassword('pw-1');

    expect(await verifyBetterAuthPassword(`${valid}$extra`, 'pw-1')).toBe(false);
    expect(await verifyBetterAuthPassword(valid, 'pw-1')).toBe(true);
  });
});

describe('DB adapter — account が指す user が存在しない場合', () => {
  it('Auth.js 互換 adapter は宙に浮いた account を null で返す', async () => {
    const db = createInMemoryAdapter();
    // linkAccount は user の実在を確かめない (実 adapter も FK 制約側に任せる)。
    // その状態で join を素通しすると undefined が呼出側に漏れる。
    await db.linkAccount({
      userId: 'user-does-not-exist',
      provider: 'github',
      providerAccountId: 'gh-1',
      type: 'oauth',
    });

    await expect(
      db.getUserByAccount({ provider: 'github', providerAccountId: 'gh-1' }),
    ).resolves.toBeNull();
  });

  it('Auth.js 互換 adapter の updateUser は未知 id を id 付きで拒否する', async () => {
    const db = createInMemoryAdapter();

    await expect(db.updateUser({ id: 'user-missing', email: 'x@example.test' })).rejects.toThrow(
      'updateUser: unknown id user-missing',
    );
  });

  it('Lucia adapter も宙に浮いた OAuth account を null で返す', async () => {
    const db = createInMemoryLuciaAdapter();
    await db.linkOAuthAccount({
      userId: 'user-does-not-exist',
      provider: 'github',
      providerAccountId: 'gh-1',
    });

    await expect(
      db.getUserByOAuthAccount({ provider: 'github', providerAccountId: 'gh-1' }),
    ).resolves.toBeNull();
  });

  it('Better Auth adapter も宙に浮いた account を null で返す', async () => {
    const db = createInMemoryBetterAuthAdapter();
    await db.linkAccount({
      userId: 'user-does-not-exist',
      provider: 'github',
      providerAccountId: 'gh-1',
    });

    await expect(
      db.getUserByAccount({ provider: 'github', providerAccountId: 'gh-1' }),
    ).resolves.toBeNull();
  });
});
