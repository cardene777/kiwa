import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetPasskeyCounters,
  createSyncFabric,
  hashPassword as hashLuciaPassword,
  hashBetterAuthPassword,
  parseDpopProof,
  setupBetterAuthEnv,
  verifyDpopProof,
  setupPasskeyEnv,
  syncPasskeyCredentials,
  verifyPassword as verifyLuciaPassword,
  verifyBetterAuthPassword,
  type BetterAuthTestEnv,
  type PasskeyCredential,
  type PasskeyTestEnv,
  type SyncFabric,
} from '../src/index.js';
import { base64UrlDecode, base64UrlEncode } from '../src/webauthn/encoding.js';
import { createSupabaseStore } from '../src/supabase/store.js';
import { createAuth0Store } from '../src/auth0/store.js';
import { __resetAuth0Store } from '../src/auth0/setup-auth0-env.js';

const passkeyEnvs: PasskeyTestEnv[] = [];
const betterAuthEnvs: BetterAuthTestEnv[] = [];

beforeEach(() => {
  __resetPasskeyCounters();
});

afterEach(async () => {
  vi.unstubAllGlobals();
  while (passkeyEnvs.length > 0) {
    const env = passkeyEnvs.pop();
    if (env) await env.stop();
  }
  while (betterAuthEnvs.length > 0) {
    const env = betterAuthEnvs.pop();
    if (env) await env.stop();
  }
});

async function makePasskeyEnv(deviceIds: string[]): Promise<PasskeyTestEnv> {
  const env = await setupPasskeyEnv({
    devices: deviceIds.map((deviceId) => ({
      deviceId,
      platform: { biometric: 'touch-id' as const },
    })),
  });
  passkeyEnvs.push(env);
  return env;
}

async function mintPasskey(
  env: PasskeyTestEnv,
  deviceId: string,
  userId: string,
  suffix: string,
  authenticatorId?: string,
): Promise<string> {
  const response = await env.createPasskey(
    deviceId,
    userId,
    {
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: userId, name: `${userId}-name`, displayName: `${userId} Display` },
      challenge: `challenge-${suffix}`,
    },
    authenticatorId,
  );
  return response.credentialId;
}

describe('passkey env — credential の所在が崩れた入力', () => {
  it('登録されていない credentialId の backup は id 付きで落とす', async () => {
    const env = await makePasskeyEnv(['macbook-1']);

    expect(() => env.backupCredential('credential-999', 'icloud-keychain')).toThrow(
      'setupPasskeyEnv: credential "credential-999" is not registered on any device',
    );
  });

  it('authenticator を明示すると同じ端末の別 authenticator に発行できる', async () => {
    const env = await makePasskeyEnv(['macbook-1']);
    // 既定は「最初に足した authenticator」 なので、 2 本目を明示指名する
    // 経路が効いていないと後から挿した security key を狙えない。
    const roaming = env.addRoamingAuthenticator('macbook-1', {
      kind: 'phone',
      hasResidentKey: true,
      hasUserVerification: true,
    });

    const credentialId = await mintPasskey(env, 'macbook-1', 'user-1', 'explicit', roaming.id);
    const passkey = env.getPasskey(credentialId);

    expect(passkey).not.toBeNull();
    expect(passkey?.transports).toEqual([roaming.transport]);

    await expect(
      env.createPasskey(
        'macbook-1',
        'user-1',
        {
          rp: { id: 'example.test', name: 'Example RP' },
          user: { id: 'user-1', name: 'n', displayName: 'd' },
          challenge: 'challenge-unknown',
        },
        'authenticator-does-not-exist',
      ),
    ).rejects.toThrow(
      'setupPasskeyEnv: authenticator "authenticator-does-not-exist" is not registered on device "macbook-1"',
    );
  });

  it('復元した credential は最終利用時刻も引き継ぐ', async () => {
    const env = await makePasskeyEnv(['macbook-1', 'ipad-1']);
    const credentialId = await mintPasskey(env, 'macbook-1', 'user-1', 'lastused');
    // assertion を 1 回通して lastUsedAt を立ててから同期する。
    await env.authenticate('macbook-1', {
      rpId: 'example.test',
      challenge: 'assert-1',
      allowCredentials: [{ id: credentialId, type: 'public-key' }],
    });
    const source = env.getPasskey(credentialId);
    expect(source?.lastUsedAt).toBeTypeOf('number');

    env.backupCredential(credentialId, 'icloud-keychain');
    const restored = env.restoreCredential('ipad-1', 'user-1', credentialId, 'icloud-keychain');

    // 落とすと新端末で signCount / 履歴の連続性が切れる。
    expect(restored.lastUsedAt).toEqual(source?.lastUsedAt);
  });

  it('device 削除で台帳から外れた credential は同期対象から黙って外す', async () => {
    const env = await makePasskeyEnv(['macbook-1', 'ipad-1', 'iphone-1']);
    const credentialId = await mintPasskey(env, 'macbook-1', 'user-1', 'orphan');
    env.backupCredential(credentialId, 'icloud-keychain');
    env.restoreCredential('ipad-1', 'user-1', credentialId, 'icloud-keychain');

    // 元端末を外すと台帳 (globalRegistry / metadata) から credential が消える。
    // ipad 側の保管庫には id だけが残るので、 ipad を source にした同期は
    // 「passkey として解決できない id」 を踏む。
    env.removeDevice('macbook-1');
    expect(env.getPasskey(credentialId)).toBeNull();

    const synced = env.syncCredentials('ipad-1', 'iphone-1', 'user-1', 'icloud-keychain');

    // 例外で同期全体を落とさず、 解決できない 1 件だけを飛ばす。
    expect(synced).toEqual([]);
  });
});

describe('syncCredentials — fabric が blob を返さない場合', () => {
  it('backup 直後に restore が空を返す credential は結果に含めない', () => {
    const real = createSyncFabric('icloud-keychain');
    // backup は受けるが restore は常に空を返す fabric。 実装が restore の
    // 空を握らないと、 undefined を register に渡して落ちる。
    const lossy: SyncFabric = {
      vendor: real.vendor,
      size: () => real.size(),
      backup: (credential) => real.backup(credential),
      restore: () => null,
      evict: (id) => real.evict(id),
      list: () => real.list(),
      clear: () => real.clear(),
    };
    const credential: PasskeyCredential = {
      credentialId: 'credential-1',
      userHandle: 'user-1',
      publicKey: 'pk',
      signCount: 0,
      transports: ['internal'],
      attachment: 'platform',
      discoverable: true,
      createdAt: Date.now(),
      originDeviceId: 'macbook-1',
      userId: 'user-1',
      syncedFabrics: [],
      syncEpoch: 0,
      backupEligible: true,
    };
    const register = vi.fn((c: PasskeyCredential) => c);

    const restored = syncPasskeyCredentials([credential], 'user-1', lossy, register);

    expect(restored).toEqual([]);
    expect(register).not.toHaveBeenCalled();
    // backup 自体は行われている (飛ばしたのは復元側だけ)。
    expect(real.size()).toBe(1);
  });
});

describe('DPoP proof の parse — payload が欠けた proof', () => {
  function craftProof(payload: Record<string, unknown>): string {
    const header = {
      typ: 'dpop+jwt',
      alg: 'ES256',
      jwk: { kty: 'EC', crv: 'P-256', x: 'x-coord', y: 'y-coord' },
    };
    const enc = (value: unknown): string =>
      Buffer.from(JSON.stringify(value))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    return `${enc(header)}.${enc(payload)}.sig`;
  }

  it('payload の必須項目が欠けていても型の揃った既定値に落とす', () => {
    const parsed = parseDpopProof(craftProof({}));

    // undefined を通すと後段の比較が "undefined" 文字列と一致してしまう。
    expect(parsed.payload).toEqual({ htm: '', htu: '', iat: 0, jti: '' });
  });

  it('jti が空の proof は replay 台帳に載せられないので verify で拒否する', () => {
    const nowMs = 1_700_000_000_000;
    const parsed = parseDpopProof(
      craftProof({
        htm: 'POST',
        htu: 'https://as.example.test/token',
        iat: Math.floor(nowMs / 1000),
      }),
    );
    expect(parsed.payload.jti).toBe('');

    // 空 jti を通すと、 同じ proof を何度でも使い回せる proof ができる
    // (Set に空文字が 1 つ入るだけで以降の replay 検知が効かない)。
    expect(() =>
      verifyDpopProof(parsed, {
        expectedHtm: 'POST',
        expectedHtu: 'https://as.example.test/token',
        seenJtis: new Set<string>(),
        now: () => nowMs,
        iatSkewSec: 60,
      }),
    ).toThrow('verifyDpopProof: proof missing jti');
  });
});

describe('webauthn encoding — atob / btoa を持たない実行環境', () => {
  it('atob が無ければ Buffer 経由で base64url を復号する', () => {
    const encoded = base64UrlEncode('kiwa-passkey');
    vi.stubGlobal('atob', undefined);

    const decoded = base64UrlDecode(encoded);

    expect(new TextDecoder().decode(decoded)).toBe('kiwa-passkey');
  });

  it('btoa が無ければ Buffer 経由で base64url を符号化する', () => {
    const expected = base64UrlEncode('kiwa-passkey');
    vi.stubGlobal('btoa', undefined);

    expect(base64UrlEncode('kiwa-passkey')).toBe(expected);
    // padding の `=` が残ると RP 側の base64url 期待と食い違う。
    expect(expected).not.toContain('=');
  });
});

describe('better-auth env — 参照先の利用者が無い操作', () => {
  it('組織作成と passkey 登録は未知 user id を id 付きで拒否する', async () => {
    const env = await setupBetterAuthEnv({ plugins: ['organizations', 'passkey'] });
    betterAuthEnvs.push(env);

    await expect(
      env.createOrganization({ name: 'Acme', slug: 'acme', userId: 'user-missing' }),
    ).rejects.toThrow('createOrganization: unknown user id user-missing');
    await expect(
      env.registerPasskey({
        userId: 'user-missing',
        credentialId: 'credential-1',
        publicKey: 'pk',
      }),
    ).rejects.toThrow('registerPasskey: unknown user id user-missing');
  });
});

describe('password 検証 — 壊れた hash 文字列', () => {
  it('lucia 版は envelope が壊れていても throw せず false を返す', async () => {
    const valid = await hashLuciaPassword('pw-1');

    // 区切りの数が合わない / 片側が空 / 長さが違う の 3 形。 sign-in 経路は
    // boolean しか扱えないので、 どれも例外にしてはいけない。
    expect(await verifyLuciaPassword(`${valid.split('$').slice(0, 4).join('$')}$`, 'pw-1')).toBe(
      false,
    );
    expect(await verifyLuciaPassword(valid.replace(/\$[^$]+\$[^$]+$/, '$$$$'), 'pw-1')).toBe(false);
    expect(await verifyLuciaPassword(`${valid}AA`, 'pw-1')).toBe(false);
    // 正常な hash はきちんと通る (上の 3 件が「常に false」 でない証拠)。
    expect(await verifyLuciaPassword(valid, 'pw-1')).toBe(true);
  });

  it('better-auth 版も同じ 3 形で false を返す', async () => {
    const valid = await hashBetterAuthPassword('pw-1');

    expect(
      await verifyBetterAuthPassword(`${valid.split('$').slice(0, 3).join('$')}$`, 'pw-1'),
    ).toBe(false);
    expect(await verifyBetterAuthPassword(valid.replace(/\$[^$]+\$[^$]+$/, '$$$$'), 'pw-1')).toBe(
      false,
    );
    expect(await verifyBetterAuthPassword(`${valid}AA`, 'pw-1')).toBe(false);
    expect(await verifyBetterAuthPassword(valid, 'pw-1')).toBe(true);
  });
});

describe('store の read 口', () => {
  it('supabase store の getSession は id 引きで session を返す', () => {
    const store = createSupabaseStore();
    const id = store.nextSessionId();
    store.createSession({
      id,
      userId: 'user-1',
      accessToken: 'at-1',
      refreshToken: 'rt-1',
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      createdAt: new Date(),
      revokedAt: undefined,
    });

    expect(store.getSession(id)?.accessToken).toBe('at-1');
    // 未知 id は null。 undefined と混ぜると呼出側の分岐が 2 種類になる。
    expect(store.getSession('session-missing')).toBeNull();
  });

  it('__resetAuth0Store は store を空にする', () => {
    const store = createAuth0Store();
    store.createUser({
      user_id: 'auth0|1',
      email: 'reset@example.com',
      email_verified: true,
      connection: 'Username-Password-Authentication',
      identities: [],
      created_at: new Date(),
      updated_at: new Date(),
    });
    expect(store.listUsers()).toHaveLength(1);

    __resetAuth0Store(store);

    expect(store.listUsers()).toHaveLength(0);
  });
});
