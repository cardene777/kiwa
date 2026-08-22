import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  deriveSupabaseMockAddress,
  generateSupabaseTotpCode,
  setupSupabaseAdvancedEnv,
  type SupabaseAdvancedTestEnv,
} from '../src/index.js';

const envs: SupabaseAdvancedTestEnv[] = [];

afterEach(async () => {
  vi.useRealTimers();
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function makeEnv(
  opts?: Parameters<typeof setupSupabaseAdvancedEnv>[0],
): Promise<SupabaseAdvancedTestEnv> {
  const env = await setupSupabaseAdvancedEnv({
    projectUrl: 'https://adv.supabase.co',
    users: [{ email: 'mfa@example.test', role: 'authenticated' }],
    ...(opts ?? {}),
  });
  envs.push(env);
  return env;
}

function seededUserId(env: SupabaseAdvancedTestEnv): string {
  const user = env.getUserById('user-1');
  if (!user) throw new Error('seed user missing');
  return user.id;
}

describe('MFA — challenge の期限と種別', () => {
  it('期限切れ challenge は verify できない', async () => {
    vi.useFakeTimers();
    const env = await makeEnv({ mfaChallengeExpiration: 300 });
    const { factor } = await env.mfa.enrollTotp({ userId: seededUserId(env) });
    const challenge = await env.mfa.challenge({ factorId: factor.id });

    vi.advanceTimersByTime(301_000);

    await expect(
      env.mfa.verifyChallenge({
        challengeId: challenge.id,
        code: generateSupabaseTotpCode(factor.secret),
      }),
    ).rejects.toThrow('verifyChallenge: challenge expired');
  });

  it('backup factor に対する challenge は verify 経路を持たない', async () => {
    const env = await makeEnv();
    const userId = seededUserId(env);
    await env.mfa.issueBackupCodes({ userId });
    // issueBackupCodes は AAL 計算のために backup 種別の factor を 1 件足す。
    // TOTP / SMS のどちらの検証手段も持たないため、 challenge を作れても
    // verify は成立しない。
    const backupFactor = env.mfa.listFactors(userId).find((f) => f.kind === 'backup');
    expect(backupFactor).toBeDefined();
    const challenge = await env.mfa.challenge({ factorId: backupFactor?.id ?? '' });

    await expect(
      env.mfa.verifyChallenge({ challengeId: challenge.id, code: '000000' }),
    ).rejects.toThrow('verifyChallenge: cannot verify challenge for backup factor');
  });
});

describe('MFA — 状態の読み出し口', () => {
  it('listFactors は当該利用者の factor だけを返す', async () => {
    const env = await makeEnv({
      users: [
        { email: 'a@example.test', role: 'authenticated' },
        { email: 'b@example.test', role: 'authenticated' },
      ],
    });
    const userA = env.getUserById('user-1')?.id ?? '';
    const userB = env.getUserById('user-2')?.id ?? '';
    await env.mfa.enrollTotp({ userId: userA, friendlyName: 'A-totp' });
    await env.mfa.enrollPhone({ userId: userB, phone: '+815550001' });

    const factorsA = env.mfa.listFactors(userA);

    // 他人の factor が混ざると MFA 一覧画面に別利用者の端末名が出る。
    expect(factorsA).toHaveLength(1);
    expect(factorsA[0]?.friendlyName).toBe('A-totp');
    expect(env.mfa.listFactors(userB).map((f) => f.kind)).toEqual(['phone']);
    expect(env.mfa.listFactors('user-missing')).toEqual([]);
  });

  it('listBackupCodes は発行済 code を複製して返す', async () => {
    const env = await makeEnv();
    const userId = seededUserId(env);

    expect(env.mfa.listBackupCodes(userId)).toEqual([]);
    const { codes } = await env.mfa.issueBackupCodes({ userId });
    const listed = env.mfa.listBackupCodes(userId);

    expect(listed.map((c) => c.code)).toEqual(codes);
    // 返り値を握り潰されても内部台帳が壊れないこと (複製を返している証拠)。
    listed.length = 0;
    expect(env.mfa.listBackupCodes(userId)).toHaveLength(codes.length);
  });

  it('getSessionAal は未知 session を aal1 として扱う', async () => {
    const env = await makeEnv();

    // AAL 不明を aal2 に倒すと、 存在しない session id で昇格を主張できる。
    expect(env.mfa.getSessionAal('session-missing')).toBe('aal1');
  });
});

describe('SIWE — challenge の寿命と一覧', () => {
  it('存在しない challengeId は not found で落とす', async () => {
    const env = await makeEnv();

    await expect(
      env.web3.verifySiweMessage({
        challengeId: 'siwe-missing',
        signature: 'sig',
        privateKey: 'pk',
      }),
    ).rejects.toThrow('verifySiweMessage: challenge not found');
  });

  it('nonce の期限が切れた challenge は署名照合まで進まない', async () => {
    vi.useFakeTimers();
    const env = await makeEnv({ siweNonceExpiration: 600 });
    const challenge = await env.web3.createSiweChallenge({
      domain: 'app.example.test',
      address: '0x2222222222222222222222222222222222222222',
      uri: 'https://app.example.test',
    });

    vi.advanceTimersByTime(601_000);

    await expect(
      env.web3.verifySiweMessage({
        challengeId: challenge.id,
        signature: 'sig',
        privateKey: 'pk',
      }),
    ).rejects.toThrow('verifySiweMessage: nonce expired');
    // 期限切れでも consume してはいけない (再発行前に nonce が失われる)。
    expect(env.web3.listChallenges()[0]?.consumed).toBe(false);
  });

  it('listChallenges は発行済 challenge を列挙する', async () => {
    const env = await makeEnv();

    expect(env.web3.listChallenges()).toEqual([]);
    const first = await env.web3.createSiweChallenge({
      domain: 'app.example.test',
      address: '0x3333333333333333333333333333333333333333',
      uri: 'https://app.example.test',
    });
    const second = await env.web3.createSiweChallenge({
      domain: 'app.example.test',
      address: '0x4444444444444444444444444444444444444444',
      uri: 'https://app.example.test',
    });

    expect(env.web3.listChallenges().map((c) => c.id)).toEqual([first.id, second.id]);
  });
});

describe('SIWE — 署名が通る経路と AAL', () => {
  it('署名検証を通すと session が発行され AAL は aal1 になる', async () => {
    const env = await makeEnv();
    const privateKey = 'wallet-private-key';
    // mock は private key から address を導出するので、 先に導出して
    // challenge の address に据える (実 secp256k1 の recover 相当)。
    const address = deriveSupabaseMockAddress(privateKey);
    const challenge = await env.web3.createSiweChallenge({
      domain: 'app.example.test',
      address,
      uri: 'https://app.example.test',
    });
    const signature = env.web3.signSiweMessage({ message: challenge.message, privateKey });

    const result = await env.web3.verifySiweMessage({
      challengeId: challenge.id,
      signature,
      privateKey,
    });

    expect(result.userId).toBeTruthy();
    // SIWE 単独では 2 要素目を通していないので aal1 のまま。
    expect(env.mfa.getSessionAal(result.sessionId)).toBe('aal1');
    expect(env.web3.listChallenges()[0]?.consumed).toBe(true);
  });
});

describe('RLS — 判定に必要な行が渡らない場合', () => {
  it('select で候補行が無ければ policy は一致しない', async () => {
    const env = await makeEnv();
    const privateKey = 'rls-wallet-key';
    const address = deriveSupabaseMockAddress(privateKey);
    const challenge = await env.web3.createSiweChallenge({
      domain: 'app.example.test',
      address,
      uri: 'https://app.example.test',
    });
    const signature = env.web3.signSiweMessage({ message: challenge.message, privateKey });
    const { accessToken } = await env.web3.verifySiweMessage({
      challengeId: challenge.id,
      signature,
      privateKey,
    });

    env.rls.defineRlsPolicy({
      name: 'own_rows',
      table: 'notes',
      command: 'all',
      roles: ['authenticated'],
      using: (row, ctx) => row.owner === ctx.userId,
      withCheck: (row, ctx) => row.owner === ctx.userId,
    });

    // 行を渡さない select。 USING を評価できないので許可の根拠が無い。
    const noRow = await env.rls.checkRlsAccess({
      table: 'notes',
      command: 'select',
      accessToken,
    });
    expect(noRow.allowed).toBe(false);
    expect(noRow.matchedPolicy).toBeUndefined();

    // 行を渡さない insert も同様に WITH CHECK を評価できない。
    const noNewRow = await env.rls.checkRlsAccess({
      table: 'notes',
      command: 'insert',
      accessToken,
    });
    expect(noNewRow.allowed).toBe(false);
  });
});
