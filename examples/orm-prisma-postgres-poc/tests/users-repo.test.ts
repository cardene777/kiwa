// PoC tests — @kiwa-lab/orm v0.6 (Prisma + testcontainers Postgres).
//
// **container は file 内で 1 つを共有する**。 起動 + schema 適用が数秒かかるのに対し
// query 1 往復は 10ms 未満で、 test ごとに立て直すとほぼ全部が起動待ちになる
// (#1773 が drizzle 側に入れた形、 本 file は #1800 で追随)。 各 test は共有 container
// の表を空にしてから始める。
//
// 共有にする理由はもう 1 つある。 container 起動を test の中で行うと、 その費用が
// **per-test timeout の予算** に乗る。 image が cache に無い run では 1 本目が pull を
// 丸ごと負担し (実測 `postgres:16-alpine` + ryuk の pull で +21s、 `mysql:8.4` で +43s)、
// 台が遅い時に 1 本目だけが timeout する。 #1800 の赤は 4 package のうち prisma 2 件で
// 起き、 どちらも落ちたのは 1 本目 (`T-PP-001` が 180008ms、 `T-PM-001` が 240015ms) で、
// 残り 7 本は落ちていない。 起動を `beforeAll` へ移すと、 一度きりの費用は一度きりの
// 予算で測られる。
//
// 例外は container の同一性そのものを見る 3 本 (T-PP-005 / T-PP-006 / T-PP-008)。 これらは
// 専用の env を立てる。

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { setupOrmEnv, expectRowCount } from '@kiwa-lab/orm';
import type { OrmTestEnvLivePrismaPostgres } from '@kiwa-lab/orm';
import { PrismaClient } from '../prisma/generated/index.js';
import { UsersRepository } from '../src/users-repo.js';

const SCHEMA_PATH = resolve(process.cwd(), 'prisma', 'schema.prisma');

let dockerAvailable = false;
/** file 内で共有する container。 docker が無い間は null。 */
let shared: OrmTestEnvLivePrismaPostgres<PrismaClient> | null = null;
/** 専用 env を使う test が後始末を任せる先。 */
let dedicated: OrmTestEnvLivePrismaPostgres<PrismaClient> | null = null;

async function newEnv(): Promise<OrmTestEnvLivePrismaPostgres<PrismaClient>> {
  return setupOrmEnv({
    mode: 'live',
    orm: 'prisma',
    dialect: 'postgres',
    prismaClient: PrismaClient,
    schemaPath: SCHEMA_PATH,
  });
}

// 予算は cold pull を含む。 実測は warm で約 3s、 pull を含めて約 24s。 台が遅い日の
// 4-8 倍 (#1800 の赤で観測された倍率) を吸えるだけ取る。
beforeAll(async () => {
  try {
    const { default: Docker } = await import('dockerode');
    await new Docker().ping();
    dockerAvailable = true;
  } catch {
    dockerAvailable = false;
    return;
  }
  shared = await newEnv();
}, 240_000);

afterAll(async () => {
  await shared?.stop();
  shared = null;
}, 60_000);

/**
 * 共有 container の表を空にする。
 *
 * FK があるので子から消す。 `deleteMany` は Prisma が dialect ごとの DELETE に
 * 落とすため、 postgres / mysql で同じ code が使える。
 */
async function resetTables(env: OrmTestEnvLivePrismaPostgres<PrismaClient>): Promise<void> {
  await env.client.post.deleteMany();
  await env.client.user.deleteMany();
}

afterEach(async () => {
  if (dedicated) {
    await dedicated.stop();
    dedicated = null;
  }
  if (shared) await resetTables(shared);
}, 60_000);

describe('UsersRepository via @kiwa-lab/orm (prisma + testcontainers postgres)', () => {
  // 共有 container を使う test の予算。 container 起動を含まないので query の往復だけ
  // を測る。 大きく取ると、 query が返らない形が 3 分間 見えないままになる。
  const QUERY_BUDGET = 60_000;

  it('T-PP-001: create + findByEmail round-trip on real Postgres via Prisma', async () => {
    if (!shared) return;
    const repo = new UsersRepository(shared.client);
    const created = await repo.create({ email: 'alice@example.com', displayName: 'Alice' });
    expect(created.ok).toBe(true);
    const found = await repo.findByEmail('alice@example.com');
    expect(found?.email).toBe('alice@example.com');
    expect(found?.displayName).toBe('Alice');
  }, QUERY_BUDGET);

  it('T-PP-002: duplicate email returns duplicate-email reason (Postgres P2002)', async () => {
    if (!shared) return;
    await shared.client.user.create({ data: { email: 'alice@example.com', displayName: 'Alice' } });
    const second = await new UsersRepository(shared.client).create({ email: 'alice@example.com', displayName: 'Alice 2' });
    expect(second).toEqual({ ok: false, reason: 'duplicate-email' });
  }, QUERY_BUDGET);

  it('T-PP-003: findByEmail returns null for missing email', async () => {
    if (!shared) return;
    expect(await new UsersRepository(shared.client).findByEmail('nobody@example.com')).toBeNull();
  }, QUERY_BUDGET);

  it('T-PP-004: user delete cascades to posts (Postgres FK onDelete: Cascade)', async () => {
    if (!shared) return;
    await shared.client.user.create({
      data: {
        email: 'a@x',
        displayName: 'A',
        posts: {
          create: [
            { title: 'p1', published: false },
            { title: 'p2', published: true },
          ],
        },
      },
    });
    const userId = (await shared.client.user.findFirstOrThrow()).id;
    const result = await new UsersRepository(shared.client).deleteCascading(userId);
    expect(result.deletedPosts).toBe(2);
    await expectRowCount(shared, 'Post', 0, expect);
    await expectRowCount(shared, 'User', 0, expect);
  }, QUERY_BUDGET);

  // 以下 3 本は container の同一性そのものが主題なので専用 env を立てる。 予算は
  // 起動を含むため共有側より大きい。
  it('T-PP-005: parallel envs are isolated (different containers + URIs)', async () => {
    if (!dockerAvailable) return;
    const envA = await newEnv();
    const envB = await newEnv();
    try {
      await envA.client.user.create({ data: { email: 'a@x', displayName: 'Alice in A' } });
      await envB.client.user.create({ data: { email: 'a@x', displayName: 'Alice in B' } });
      const a = await envA.client.user.findUniqueOrThrow({ where: { email: 'a@x' } });
      const b = await envB.client.user.findUniqueOrThrow({ where: { email: 'a@x' } });
      expect(a.displayName).toBe('Alice in A');
      expect(b.displayName).toBe('Alice in B');
      expect(envA.connectionUri).not.toBe(envB.connectionUri);
      // 共有 container とも別であること。 2 つが互いに別なだけでは、 共有を
      // 使い回している形と区別が付かない。
      if (shared) expect(envA.connectionUri).not.toBe(shared.connectionUri);
    } finally {
      await envA.stop();
      await envB.stop();
    }
  }, 240_000);

  it('T-PP-006: stop() disconnects PrismaClient + tears down container', async () => {
    if (!dockerAvailable) return;
    const local = await newEnv();
    await local.stop();
    // 切断後の query は reject。
    await expect(local.client.user.findMany()).rejects.toBeDefined();
  }, 180_000);

  it('T-PP-007: env.connectionUri は postgres:// 接頭辞を持つ', async () => {
    if (!shared) return;
    expect(shared.connectionUri).toMatch(/^postgres(?:ql)?:\/\//);
  }, QUERY_BUDGET);

  it('T-PP-008: seed callback runs before tests see env', async () => {
    if (!dockerAvailable) return;
    dedicated = await setupOrmEnv({
      mode: 'live',
      orm: 'prisma',
      dialect: 'postgres',
      prismaClient: PrismaClient,
      schemaPath: SCHEMA_PATH,
      seed: async (client) => {
        await client.user.create({ data: { email: 'seeded@example.com', displayName: 'Seed' } });
      },
    });
    const found = await dedicated.client.user.findUnique({ where: { email: 'seeded@example.com' } });
    expect(found?.displayName).toBe('Seed');
  }, 180_000);
});
