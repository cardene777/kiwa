import { afterEach, describe, expect, it } from 'vitest';
import { setupClerkEnv, type ClerkTestEnv } from '../src/index.js';
import { __resetClerkStore } from '../src/clerk/setup-clerk-env.js';
import { createClerkStore } from '../src/clerk/store.js';

const envs: ClerkTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function makeEnv(
  opts?: Parameters<typeof setupClerkEnv>[0],
): Promise<ClerkTestEnv> {
  const env = await setupClerkEnv(opts);
  envs.push(env);
  return env;
}

describe('setupClerkEnv — token 発行と参照の残り経路', () => {
  it('createUser は publicMetadata / privateMetadata を渡した時だけ載せる', async () => {
    const env = await makeEnv();

    const withMeta = await env.users.createUser({
      primaryEmailAddress: 'meta@example.com',
      publicMetadata: { plan: 'pro' },
      privateMetadata: { internalNote: 'vip' },
    });
    const withoutMeta = await env.users.createUser({
      primaryEmailAddress: 'nometa@example.com',
    });

    expect(withMeta.publicMetadata).toEqual({ plan: 'pro' });
    expect(withMeta.privateMetadata).toEqual({ internalNote: 'vip' });
    // 未指定を空 object で埋めると「設定した」 と「していない」 が
    // 区別できなくなるため undefined のまま残す。
    expect(withoutMeta.publicMetadata).toBeUndefined();
    expect(withoutMeta.privateMetadata).toBeUndefined();
  });

  it('sessions.getSession は存在する session をそのまま返す', async () => {
    const env = await makeEnv();
    const user = await env.users.createUser({ primaryEmailAddress: 'sess@example.com' });
    const created = await env.sessions.createSession({ userId: user.id });

    const fetched = await env.sessions.getSession(created.session.id);

    expect(fetched.id).toBe(created.session.id);
    expect(fetched.userId).toBe(user.id);
    expect(fetched.status).toBe('active');
  });

  it('organizations.getOrganization は存在する組織をそのまま返す', async () => {
    const env = await makeEnv();
    const owner = await env.users.createUser({ primaryEmailAddress: 'owner@example.com' });
    const org = await env.organizations.createOrganization({
      name: 'Acme',
      slug: 'acme',
      createdBy: owner.id,
    });

    const fetched = await env.organizations.getOrganization(org.id);

    expect(fetched.slug).toBe('acme');
    expect(fetched.createdBy).toBe(owner.id);
  });

  it('署名は通るが session が消えている token は verifyToken で拒否する', async () => {
    const env = await makeEnv();
    await env.users.createUser({ primaryEmailAddress: 'gone@example.com' });
    const { token, session } = await env.signIn({ email: 'gone@example.com' });

    // stop() は store を空にするだけで env は使い続けられる。
    // 署名も有効期限も生きたまま「参照先だけ消えた」 状態を作れる。
    await env.stop();

    await expect(env.verifyToken(token)).rejects.toThrow(
      `verifyToken: session ${session.id} not found`,
    );
  });
});

describe('__resetClerkStore — test 用の reset 口', () => {
  it('store を空にして id 採番も初期化する', async () => {
    const store = createClerkStore();
    store.createUser({
      id: store.nextUserId(),
      primaryEmailAddress: 'reset@example.com',
      emailAddresses: [],
      phoneNumbers: [],
      externalAccounts: [],
      createdAt: new Date(),
    });
    expect(store.listUsers()).toHaveLength(1);

    __resetClerkStore(store);

    expect(store.listUsers()).toHaveLength(0);
    // 採番が戻らないと suite をまたいだ id 期待値が壊れる。
    expect(store.nextUserId()).toBe('user_000001');
  });
});

describe('clerk store — 参照先が無い patch と連鎖削除', () => {
  it('deleteUser は所属していた membership も一緒に落とす', () => {
    const store = createClerkStore();
    const userId = store.nextUserId();
    store.createUser({
      id: userId,
      primaryEmailAddress: 'member@example.com',
      emailAddresses: [],
      phoneNumbers: [],
      externalAccounts: [],
      createdAt: new Date(),
    });
    const orgId = store.nextOrganizationId();
    store.createOrganization({
      id: orgId,
      name: 'Acme',
      slug: 'acme',
      createdBy: userId,
      createdAt: new Date(),
    });
    store.createMembership({
      id: store.nextMembershipId(),
      organizationId: orgId,
      userId,
      role: 'owner',
      createdAt: new Date(),
    });
    store.createSession({
      id: store.nextSessionId(),
      userId,
      status: 'active',
      expiresAt: new Date(Date.now() + 60_000),
      token: '',
    });

    store.deleteUser(userId);

    // membership が残ると、 消えた利用者が組織の owner のままになる。
    expect(store.listMembershipsForOrganization(orgId)).toHaveLength(0);
    expect(store.listSessionsForUser(userId)).toHaveLength(0);
  });

  it('存在しない session / membership への patch は id 付きで落とす', () => {
    const store = createClerkStore();

    expect(() => store.updateSession('sess-missing', { status: 'revoked' })).toThrow(
      'Clerk store: unknown session id sess-missing',
    );
    expect(() => store.updateMembership('org-x', 'user-x', { role: 'admin' })).toThrow(
      'Clerk store: membership org-x/user-x not found',
    );
  });
});
