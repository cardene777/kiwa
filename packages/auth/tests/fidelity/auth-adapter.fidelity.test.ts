/**
 * fidelity test — `docs/concepts/test-taxonomy.md § fidelity` pattern。
 *
 * createInMemoryAdapter (kiwa auth mock adapter、 Auth.js contract 準拠) が、 想定
 * reference impl (Map ベース単純 store) と同じ user CRUD 挙動を返すことを保証する。
 * mock ≠ 実 DB (Prisma / Drizzle adapter) 比較の live fidelity は別 file 化して
 * `*.real.fidelity.test.ts` で書く経路 (現状 scope 外)。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createInMemoryAdapter } from '../../src/index.js';
import type { AuthUser } from '../../src/types.js';

interface RefUser {
  readonly id: string;
  readonly email: string;
}

/** Reference impl = 仕様通り動く最小 Map ベース user store。 mock 挙動の期待仕様を体現する。 */
function referenceStore() {
  const users = new Map<string, RefUser>();
  const byEmail = new Map<string, RefUser>();
  const accounts = new Map<string, { userId: string; provider: string; providerAccountId: string }>();
  const sessions = new Map<string, { sessionToken: string; userId: string }>();
  const verificationTokens = new Map<string, { identifier: string; token: string }>();
  let counter = 0;
  const accountKey = (p: string, a: string) => `${p}:${a}`;
  return {
    async createUser(input: { email: string; name?: string }): Promise<RefUser> {
      counter += 1;
      const user: RefUser = { id: `user-${counter}`, email: input.email };
      users.set(user.id, user);
      byEmail.set(user.email, user);
      return user;
    },
    async getUser(id: string): Promise<RefUser | null> {
      return users.get(id) ?? null;
    },
    async getUserByEmail(email: string): Promise<RefUser | null> {
      return byEmail.get(email) ?? null;
    },
    async getUserByAccount(input: { provider: string; providerAccountId: string }): Promise<RefUser | null> {
      const account = accounts.get(accountKey(input.provider, input.providerAccountId));
      if (!account) return null;
      return users.get(account.userId) ?? null;
    },
    async updateUser(patch: { id: string; email?: string; name?: string }): Promise<RefUser> {
      const current = users.get(patch.id);
      if (!current) throw new Error(`updateUser: unknown id ${patch.id}`);
      if (patch.email !== undefined && patch.email !== current.email) {
        byEmail.delete(current.email);
      }
      const next: RefUser = { ...current, ...(patch.email !== undefined ? { email: patch.email } : {}) };
      users.set(next.id, next);
      byEmail.set(next.email, next);
      return next;
    },
    async deleteUser(id: string): Promise<void> {
      const user = users.get(id);
      if (!user) return;
      users.delete(id);
      byEmail.delete(user.email);
      for (const [k, a] of accounts) if (a.userId === id) accounts.delete(k);
      for (const [k, s] of sessions) if (s.userId === id) sessions.delete(k);
    },
    async linkAccount(input: { userId: string; provider: string; providerAccountId: string }) {
      accounts.set(accountKey(input.provider, input.providerAccountId), input);
      return input;
    },
    async unlinkAccount(input: { provider: string; providerAccountId: string }): Promise<void> {
      accounts.delete(accountKey(input.provider, input.providerAccountId));
    },
    async createSession(input: { sessionToken: string; userId: string }) {
      sessions.set(input.sessionToken, input);
      return input;
    },
    async getSessionAndUser(sessionToken: string): Promise<{ session: { sessionToken: string; userId: string }; user: RefUser } | null> {
      const session = sessions.get(sessionToken);
      if (!session) return null;
      const user = users.get(session.userId);
      if (!user) return null;
      return { session, user };
    },
    async deleteSession(sessionToken: string): Promise<void> {
      sessions.delete(sessionToken);
    },
    async createVerificationToken(input: { identifier: string; token: string }) {
      verificationTokens.set(`${input.identifier}:${input.token}`, input);
      return input;
    },
    async useVerificationToken(input: { identifier: string; token: string }) {
      const key = `${input.identifier}:${input.token}`;
      const value = verificationTokens.get(key);
      if (!value) return null;
      verificationTokens.delete(key);
      return value;
    },
  };
}

/** mock 側の AuthUser を reference shape (id + email のみ) に投影して比較する。 */
function project(user: AuthUser | RefUser | null): RefUser | null {
  if (user === null) return null;
  return { id: user.id, email: user.email };
}

describe('createInMemoryAdapter fidelity vs reference impl', () => {
  it('createUser → getUser round-trip = reference と一致 (id + email projection)', async () => {
    const mock = createInMemoryAdapter();
    const real = referenceStore();

    const result = await assertFidelity({
      mockFn: async (email: string) => {
        const created = await mock.createUser({ email });
        return project(await mock.getUser(created.id));
      },
      realFn: async (email: string) => {
        const created = await real.createUser({ email });
        return project(await real.getUser(created.id));
      },
      cases: [
        {
          name: 'createUser + getUser',
          args: ['alice@example.com'] as [string],
          compare: (m, r) =>
            (m?.email ?? null) === (r?.email ?? null) &&
            (m?.id.startsWith('user-') ?? false) === (r?.id.startsWith('user-') ?? false),
        },
      ],
    });
    expect(result.ratio).toBe(100);
    expect(result.divergences).toEqual([]);
  });

  it('getUserByEmail (存在) / getUserByEmail (未 set) の両 case で mock ↔ reference 一致', async () => {
    const mock = createInMemoryAdapter();
    const real = referenceStore();

    await mock.createUser({ email: 'seed@example.com' });
    await real.createUser({ email: 'seed@example.com' });

    const result = await assertFidelity({
      mockFn: async (email: string) => project(await mock.getUserByEmail(email)),
      realFn: async (email: string) => project(await real.getUserByEmail(email)),
      cases: [
        {
          name: '存在 email',
          args: ['seed@example.com'],
          compare: (m, r) => (m === null && r === null) || m?.email === r?.email,
        },
        {
          name: '未 set email',
          args: ['missing@example.com'],
          compare: (m, r) => (m === null && r === null) || m?.email === r?.email,
        },
      ],
    });
    expect(result.ratio).toBe(100);
    expect(result.failed).toBe(0);
  });

  it('deleteUser で subsequent getUser = 両実装で null 返す', async () => {
    const mock = createInMemoryAdapter();
    const real = referenceStore();

    const mockUser = await mock.createUser({ email: 'to-delete@example.com' });
    const realUser = await real.createUser({ email: 'to-delete@example.com' });

    const result = await assertFidelity({
      mockFn: async () => {
        await mock.deleteUser(mockUser.id);
        return project(await mock.getUser(mockUser.id));
      },
      realFn: async () => {
        await real.deleteUser(realUser.id);
        return project(await real.getUser(realUser.id));
      },
      cases: [{ name: 'delete → getUser = null', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);
    expect(result.divergences).toEqual([]);
  });

  it('updateUser で email 変更 = 新 email で getUserByEmail が hit (mock ↔ reference)', async () => {
    const mock = createInMemoryAdapter();
    const real = referenceStore();

    const mockUser = await mock.createUser({ email: 'old@example.com' });
    const realUser = await real.createUser({ email: 'old@example.com' });

    const result = await assertFidelity({
      mockFn: async () => {
        await mock.updateUser({ id: mockUser.id, email: 'new@example.com' });
        return project(await mock.getUserByEmail('new@example.com'));
      },
      realFn: async () => {
        await real.updateUser({ id: realUser.id, email: 'new@example.com' });
        return project(await real.getUserByEmail('new@example.com'));
      },
      cases: [
        {
          name: 'update email → getUserByEmail 新 email hit',
          args: [] as [],
          compare: (m, r) => (m === null && r === null) || m?.email === r?.email,
        },
      ],
    });
    expect(result.ratio).toBe(100);
  });

  it('updateUser で email 変更後 = 旧 email での getUserByEmail = null (両実装)', async () => {
    const mock = createInMemoryAdapter();
    const real = referenceStore();

    const mockUser = await mock.createUser({ email: 'old2@example.com' });
    const realUser = await real.createUser({ email: 'old2@example.com' });

    const result = await assertFidelity({
      mockFn: async () => {
        await mock.updateUser({ id: mockUser.id, email: 'new2@example.com' });
        return project(await mock.getUserByEmail('old2@example.com'));
      },
      realFn: async () => {
        await real.updateUser({ id: realUser.id, email: 'new2@example.com' });
        return project(await real.getUserByEmail('old2@example.com'));
      },
      cases: [{ name: '旧 email 消失', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('linkAccount → getUserByAccount で紐付 user を返す (両実装一致)', async () => {
    const mock = createInMemoryAdapter();
    const real = referenceStore();

    const mockUser = await mock.createUser({ email: 'oauth@example.com' });
    const realUser = await real.createUser({ email: 'oauth@example.com' });
    await mock.linkAccount({
      userId: mockUser.id,
      provider: 'github',
      providerAccountId: 'gh-123',
      type: 'oauth',
    });
    await real.linkAccount({
      userId: realUser.id,
      provider: 'github',
      providerAccountId: 'gh-123',
    });

    const result = await assertFidelity({
      mockFn: async () => project(await mock.getUserByAccount({ provider: 'github', providerAccountId: 'gh-123' })),
      realFn: async () => project(await real.getUserByAccount({ provider: 'github', providerAccountId: 'gh-123' })),
      cases: [
        {
          name: 'linked account 経由で user 取得',
          args: [] as [],
          compare: (m, r) => (m === null && r === null) || m?.email === r?.email,
        },
      ],
    });
    expect(result.ratio).toBe(100);
  });

  it('unlinkAccount 後 = getUserByAccount = null (両実装)', async () => {
    const mock = createInMemoryAdapter();
    const real = referenceStore();

    const mockUser = await mock.createUser({ email: 'unlink@example.com' });
    const realUser = await real.createUser({ email: 'unlink@example.com' });
    await mock.linkAccount({
      userId: mockUser.id,
      provider: 'google',
      providerAccountId: 'g-99',
      type: 'oauth',
    });
    await real.linkAccount({
      userId: realUser.id,
      provider: 'google',
      providerAccountId: 'g-99',
    });
    await mock.unlinkAccount({ provider: 'google', providerAccountId: 'g-99' });
    await real.unlinkAccount({ provider: 'google', providerAccountId: 'g-99' });

    const result = await assertFidelity({
      mockFn: async () => project(await mock.getUserByAccount({ provider: 'google', providerAccountId: 'g-99' })),
      realFn: async () => project(await real.getUserByAccount({ provider: 'google', providerAccountId: 'g-99' })),
      cases: [{ name: 'unlink 後 null', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('createSession + getSessionAndUser で user + session を返す (両実装)', async () => {
    const mock = createInMemoryAdapter();
    const real = referenceStore();

    const mockUser = await mock.createUser({ email: 'sess@example.com' });
    const realUser = await real.createUser({ email: 'sess@example.com' });
    await mock.createSession({
      sessionToken: 'tok-1',
      userId: mockUser.id,
      expires: new Date('2099-12-31'),
    });
    await real.createSession({ sessionToken: 'tok-1', userId: realUser.id });

    const result = await assertFidelity({
      mockFn: async () => {
        const res = await mock.getSessionAndUser('tok-1');
        return res ? project(res.user) : null;
      },
      realFn: async () => {
        const res = await real.getSessionAndUser('tok-1');
        return res ? project(res.user) : null;
      },
      cases: [
        {
          name: 'session token → user 取得',
          args: [] as [],
          compare: (m, r) => (m === null && r === null) || m?.email === r?.email,
        },
      ],
    });
    expect(result.ratio).toBe(100);
  });

  it('deleteSession 後 = getSessionAndUser = null (両実装)', async () => {
    const mock = createInMemoryAdapter();
    const real = referenceStore();

    const mockUser = await mock.createUser({ email: 'sessdel@example.com' });
    const realUser = await real.createUser({ email: 'sessdel@example.com' });
    await mock.createSession({
      sessionToken: 'tok-del',
      userId: mockUser.id,
      expires: new Date('2099-12-31'),
    });
    await real.createSession({ sessionToken: 'tok-del', userId: realUser.id });

    const result = await assertFidelity({
      mockFn: async () => {
        await mock.deleteSession('tok-del');
        return await mock.getSessionAndUser('tok-del');
      },
      realFn: async () => {
        await real.deleteSession('tok-del');
        return await real.getSessionAndUser('tok-del');
      },
      cases: [{ name: 'delete session → null', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('createVerificationToken + useVerificationToken = 1 度使うと消費 (両実装 use-once)', async () => {
    const mock = createInMemoryAdapter();
    const real = referenceStore();

    await mock.createVerificationToken({
      identifier: 'email@example.com',
      token: 'verify-tok',
      expires: new Date('2099-12-31'),
    });
    await real.createVerificationToken({ identifier: 'email@example.com', token: 'verify-tok' });

    const result = await assertFidelity({
      mockFn: async () => {
        // 1 回目 = 消費、 2 回目 = null
        const first = await mock.useVerificationToken({ identifier: 'email@example.com', token: 'verify-tok' });
        const second = await mock.useVerificationToken({ identifier: 'email@example.com', token: 'verify-tok' });
        return { first: first !== null, second };
      },
      realFn: async () => {
        const first = await real.useVerificationToken({ identifier: 'email@example.com', token: 'verify-tok' });
        const second = await real.useVerificationToken({ identifier: 'email@example.com', token: 'verify-tok' });
        return { first: first !== null, second };
      },
      cases: [
        {
          name: 'use-once semantics (1 回目 hit / 2 回目 null)',
          args: [] as [],
          compare: (m, r) => m.first === r.first && m.second === r.second,
        },
      ],
    });
    expect(result.ratio).toBe(100);
  });

  it('deleteUser 後 = getUserByAccount / getSessionAndUser も cascade で null (両実装 cascade)', async () => {
    const mock = createInMemoryAdapter();
    const real = referenceStore();

    const mockUser = await mock.createUser({ email: 'cascade@example.com' });
    const realUser = await real.createUser({ email: 'cascade@example.com' });
    await mock.linkAccount({
      userId: mockUser.id,
      provider: 'github',
      providerAccountId: 'x-1',
      type: 'oauth',
    });
    await real.linkAccount({ userId: realUser.id, provider: 'github', providerAccountId: 'x-1' });
    await mock.createSession({
      sessionToken: 'x-tok',
      userId: mockUser.id,
      expires: new Date('2099-12-31'),
    });
    await real.createSession({ sessionToken: 'x-tok', userId: realUser.id });

    const result = await assertFidelity({
      mockFn: async () => {
        await mock.deleteUser(mockUser.id);
        return {
          byAccount: await mock.getUserByAccount({ provider: 'github', providerAccountId: 'x-1' }),
          session: await mock.getSessionAndUser('x-tok'),
        };
      },
      realFn: async () => {
        await real.deleteUser(realUser.id);
        return {
          byAccount: await real.getUserByAccount({ provider: 'github', providerAccountId: 'x-1' }),
          session: await real.getSessionAndUser('x-tok'),
        };
      },
      cases: [
        {
          name: 'delete user cascade (account / session も無効化)',
          args: [] as [],
          compare: (m, r) => m.byAccount === null && r.byAccount === null && m.session === null && r.session === null,
        },
      ],
    });
    expect(result.ratio).toBe(100);
  });
});
