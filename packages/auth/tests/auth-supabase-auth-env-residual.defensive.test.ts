import { afterEach, describe, expect, it, vi } from 'vitest';
import { setupSupabaseAuthEnv } from '../src/index.js';
import type { SupabaseAuthTestEnv } from '../src/supabase/types.js';

const envs: SupabaseAuthTestEnv[] = [];

afterEach(async () => {
  vi.useRealTimers();
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function makeEnv(
  opts?: Parameters<typeof setupSupabaseAuthEnv>[0],
): Promise<SupabaseAuthTestEnv> {
  const env = await setupSupabaseAuthEnv(opts);
  envs.push(env);
  return env;
}

describe('buildUserRecord — identity / metadata の既定値', () => {
  it('email 以外の provider の identity は provider-userId 形式の identityId を持つ', async () => {
    // Supabase の実 API では provider ごとに identityId の作り方が違う。
    // email だけが「宛先そのもの」 で、 それ以外は provider 名を前置する。
    const env = await makeEnv({
      users: [
        {
          email: 'oauth@example.test',
          identities: [
            { provider: 'github', identityData: { login: 'octocat' } },
            { provider: 'google' },
          ],
        },
      ],
    });

    const user = await env.admin.getUserByEmail('oauth@example.test');

    expect(user).not.toBeNull();
    const identities = user?.identities ?? [];
    expect(identities.map((i) => i.provider)).toEqual(['github', 'google']);
    expect(identities[0]?.identityId).toBe(`github-${user?.id}`);
    expect(identities[0]?.identityData).toEqual({ login: 'octocat' });
    // identityData 未指定なら空 object に落ちる。 undefined のままだと
    // 呼出側が毎回 null check を書くことになる。
    expect(identities[1]?.identityData).toEqual({});
    // appMetadata 未指定時の provider は 1 件目の identity から引く。
    expect(user?.appMetadata).toEqual({ provider: 'github' });
  });

  it('email 用 identity は email / phone / userId の順で identityId を決める', async () => {
    const env = await makeEnv({
      users: [{ phone: '+815550001', identities: [{ provider: 'email' }] }],
    });

    const [user] = await env.admin.listUsers();

    // email が無ければ phone に落ちる。 ここが userId に落ちると、
    // 同じ利用者を別経路から引けなくなる。
    expect(user?.identities?.[0]?.identityId).toBe('+815550001');
  });

  it('phoneConfirm を立てると phoneConfirmedAt が入る', async () => {
    const env = await makeEnv();

    const user = await env.admin.createUser({
      phone: '+815550002',
      phoneConfirm: true,
    });

    expect(user.phoneConfirmedAt).toBeInstanceOf(Date);
    expect(user.emailConfirmedAt).toBeUndefined();
  });
});

describe('signIn / signOut の phone 経路と欠損経路', () => {
  it('phone + password でサインインできる', async () => {
    const env = await makeEnv({
      users: [{ phone: '+815550003', password: 'pw-1', phoneConfirmed: true }],
    });

    const { session } = await env.auth.signInWithPassword({
      phone: '+815550003',
      password: 'pw-1',
    });

    expect(session.user.phone).toBe('+815550003');
    expect(session.accessToken.length).toBeGreaterThan(0);
  });

  it('signUp は options を渡さなくても userMetadata 未設定で成立する', async () => {
    const env = await makeEnv();

    const { user, session } = await env.auth.signUp({
      email: 'new@example.test',
      password: 'pw-1',
    });

    expect(user.userMetadata).toEqual({});
    // Supabase の既定 project は確認メール必須なので session は返らない。
    expect(session).toBeNull();
  });

  it('未知の accessToken での signOut は黙って何もしない (RFC 7009 型の寛容さ)', async () => {
    const env = await makeEnv({
      users: [{ email: 'a@example.test', password: 'pw-1' }],
    });
    const { session } = await env.auth.signInWithPassword({
      email: 'a@example.test',
      password: 'pw-1',
    });

    await expect(env.auth.signOut({ accessToken: 'not-a-real-token' })).resolves.toBeUndefined();
    // 無関係な token を投げても既存 session が巻き添えで失効しないこと。
    await expect(env.auth.getUser(session.accessToken)).resolves.toMatchObject({
      email: 'a@example.test',
    });
  });

  it('署名は通るが利用者が消えている access token は getUser で拒否する', async () => {
    const env = await makeEnv({
      users: [{ email: 'ghost@example.test', password: 'pw-1' }],
    });
    const { session } = await env.auth.signInWithPassword({
      email: 'ghost@example.test',
      password: 'pw-1',
    });
    const user = await env.admin.getUserByEmail('ghost@example.test');
    await env.admin.deleteUser(user?.id ?? '');

    await expect(env.auth.getUser(session.accessToken)).rejects.toThrow(
      'getUser: user backing session no longer exists',
    );
  });

  it('利用者が消えた session の refresh は拒否する', async () => {
    const env = await makeEnv({
      users: [{ email: 'ghost2@example.test', password: 'pw-1' }],
    });
    const { session } = await env.auth.signInWithPassword({
      email: 'ghost2@example.test',
      password: 'pw-1',
    });
    const user = await env.admin.getUserByEmail('ghost2@example.test');
    await env.admin.deleteUser(user?.id ?? '');

    await expect(env.auth.refreshSession({ refreshToken: session.refreshToken })).rejects.toThrow(
      'refreshSession: user backing session no longer exists',
    );
  });
});

describe('signInWithOAuth の URL 組み立て', () => {
  it('redirectTo / scopes を渡すと authorize URL に載る', async () => {
    const env = await makeEnv({ projectUrl: 'https://proj.supabase.co' });

    const pending = await env.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: 'https://app.example.test/cb', scopes: 'repo' },
    });

    expect(pending.url).toContain('provider=github');
    expect(pending.url).toContain('redirect_to=https://app.example.test/cb');
    expect(pending.url).toContain('scopes=repo');
  });

  it('options 未指定なら redirect_to / scopes は空文字になる', async () => {
    const env = await makeEnv({ projectUrl: 'https://proj.supabase.co' });

    const pending = await env.auth.signInWithOAuth({ provider: 'google' });

    // undefined を文字列化して "undefined" が URL に載るのを防ぐ既定。
    expect(pending.url).toContain('redirect_to=&scopes=');
    expect(pending.url).not.toContain('undefined');
  });
});

describe('verifyOtp の期限 / 種別分岐', () => {
  it('期限切れ OTP は consume せずに拒否する', async () => {
    vi.useFakeTimers();
    const env = await makeEnv({ otpExpiration: 60 });
    const { otp } = await env.auth.signInWithOtp({ email: 'otp@example.test' });

    vi.advanceTimersByTime(61_000);

    await expect(
      env.auth.verifyOtp({ email: 'otp@example.test', token: otp.code, type: 'magiclink' }),
    ).rejects.toThrow('verifyOtp: OTP has expired');
    // 拒否した以上、 code は未消費のまま残っていなければならない
    // (消費してしまうと再送前に利用者が詰む)。
    expect(env.listOtpDeliveries('email')[0]?.consumed).toBe(false);
  });

  it('SMS OTP は phone 経路で解決し phoneConfirmedAt を立てる', async () => {
    const env = await makeEnv();
    const { otp } = await env.auth.signInWithOtp({ phone: '+815550004' });

    const { user } = await env.auth.verifyOtp({
      phone: '+815550004',
      token: otp.code,
      type: 'sms',
    });

    expect(user.phoneConfirmedAt).toBeInstanceOf(Date);
    // sms は email 側を触らない。 両方立ててしまうと未確認 email が
    // 確認済に化ける。
    expect(user.emailConfirmedAt).toBeUndefined();
  });

  it('recovery は email も phone も新たに確認済にしない', async () => {
    const env = await makeEnv();
    await env.auth.signInWithOtp({ email: 'recover@example.test' });
    const [delivery] = env.listOtpDeliveries('email');

    const { user } = await env.auth.verifyOtp({
      email: 'recover@example.test',
      token: delivery?.code ?? '',
      type: 'recovery',
    });

    expect(user.emailConfirmedAt).toBeUndefined();
    expect(user.phoneConfirmedAt).toBeUndefined();
  });

  it('OTP 発行後に利用者が消えていれば consume 後の解決失敗として落とす', async () => {
    const env = await makeEnv();
    const { otp } = await env.auth.signInWithOtp({ phone: '+815550005' });
    const [user] = await env.admin.listUsers();
    await env.admin.deleteUser(user?.id ?? '');

    await expect(
      env.auth.verifyOtp({ phone: '+815550005', token: otp.code, type: 'sms' }),
    ).rejects.toThrow('verifyOtp: user not found after OTP consumption');
  });
});

describe('admin API の残り経路', () => {
  it('getUserById は存在すれば返し、 無ければ id 付きで落ちる', async () => {
    const env = await makeEnv({ users: [{ email: 'admin@example.test' }] });
    const [seeded] = await env.admin.listUsers();

    await expect(env.admin.getUserById(seeded?.id ?? '')).resolves.toMatchObject({
      email: 'admin@example.test',
    });
    await expect(env.admin.getUserById('user-missing')).rejects.toThrow(
      'admin.getUserById: user user-missing not found',
    );
  });

  it('updateUserById は email / phone / 確認フラグ / metadata / password をまとめて反映する', async () => {
    const env = await makeEnv({ users: [{ email: 'patch@example.test', password: 'old-pw' }] });
    const [seeded] = await env.admin.listUsers();
    const id = seeded?.id ?? '';

    const updated = await env.admin.updateUserById(id, {
      email: 'patched@example.test',
      phone: '+815550006',
      emailConfirm: true,
      phoneConfirm: true,
      appMetadata: { plan: 'pro' },
      userMetadata: { nickname: 'patched' },
      password: 'new-pw',
    });

    expect(updated.email).toBe('patched@example.test');
    expect(updated.phone).toBe('+815550006');
    expect(updated.emailConfirmedAt).toBeInstanceOf(Date);
    expect(updated.phoneConfirmedAt).toBeInstanceOf(Date);
    expect(updated.appMetadata).toEqual({ plan: 'pro' });
    expect(updated.userMetadata).toEqual({ nickname: 'patched' });

    // password patch が届いていないと旧 password のままサインインできてしまう。
    await expect(
      env.auth.signInWithPassword({ email: 'patched@example.test', password: 'old-pw' }),
    ).rejects.toThrow('signInWithPassword: invalid login credentials');
    await expect(
      env.auth.signInWithPassword({ email: 'patched@example.test', password: 'new-pw' }),
    ).resolves.toMatchObject({ user: { email: 'patched@example.test' } });
  });

  it('確認フラグを false で渡すと確認済 timestamp が外れる', async () => {
    const env = await makeEnv();
    const created = await env.admin.createUser({
      email: 'unconfirm@example.test',
      phone: '+815550007',
      emailConfirm: true,
      phoneConfirm: true,
    });

    const updated = await env.admin.updateUserById(created.id, {
      emailConfirm: false,
      phoneConfirm: false,
    });

    // true / false のどちらでも「渡されたか」 で分岐する必要がある。
    // truthy 判定にすると false が「未指定」 と同義になり解除できない。
    expect(updated.emailConfirmedAt).toBeUndefined();
    expect(updated.phoneConfirmedAt).toBeUndefined();
  });
});
