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
  let counter = 0;
  return {
    async createUser(input: { email: string }): Promise<RefUser> {
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
    async deleteUser(id: string): Promise<void> {
      const user = users.get(id);
      if (!user) return;
      users.delete(id);
      byEmail.delete(user.email);
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
});
