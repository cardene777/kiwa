// PoC tests — @kiwa-lab/orm v0.7 (Prisma + testcontainers MySQL).
//
// **container は file 内で 1 つを共有する**。 起動 + schema 適用が実測 21.5 秒かかるのに
// 対し query 1 往復は 10ms 未満で、 test ごとに立て直すとほぼ全部が起動待ちになる
// (#1773 が drizzle 側に入れた形、 本 file は #1800 で追随)。 各 test は共有 container
// の表を空にしてから始める。
//
// 共有にする理由はもう 1 つある。 container 起動を test の中で行うと、 その費用が
// **per-test timeout の予算** に乗る。 image が cache に無い run では 1 本目が pull を
// 丸ごと負担し (実測 `mysql:8.4` の pull で +43s)、 台が遅い時に 1 本目だけが timeout
// する。 #1800 の赤は 4 package のうち prisma 2 件で起き、 どちらも落ちたのは 1 本目
// (`T-PM-001` が 240015ms、 `T-PP-001` が 180008ms) で、 残り 7 本は落ちていない。
// 起動を `beforeAll` へ移すと、 一度きりの費用は一度きりの予算で測られる。
//
// 例外は container の同一性そのものを見る 3 本 (T-PM-005 / T-PM-006 / T-PM-008)。 これらは
// 専用の env を立てる。

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { setupOrmEnv, expectRowCount } from '@kiwa-lab/orm';
import type { OrmTestEnvLivePrismaMysql } from '@kiwa-lab/orm';
import { PrismaClient } from '../prisma/generated/index.js';
import { UsersRepository } from '../src/users-repo.js';

const SCHEMA_PATH = resolve(process.cwd(), 'prisma', 'schema.prisma');

let dockerAvailable = false;
/** file 内で共有する container。 docker が無い間は null。 */
let shared: OrmTestEnvLivePrismaMysql<PrismaClient> | null = null;
/**
 * 専用 env を使う test の後始末先。
 *
 * test の中で `finally` を書く形だと 2 つ漏れる。 2 つ目の生成が失敗した時に 1 つ目が
 * 止まらない (生成は `try` の外にある) のと、 1 つ目の `stop()` が失敗した時に 2 つ目に
 * 到達しない。 どちらも container が残る (PR #1906 Round 1)。
 *
 * 生成した直後に `track` へ載せ、 後始末は `afterEach` が引き受ける。 自分で止めた env は
 * `release` で外す = `stop()` は container を止めるので 2 度呼べない。
 */
let dedicated: OrmTestEnvLivePrismaMysql<PrismaClient>[] = [];

function track(env: OrmTestEnvLivePrismaMysql<PrismaClient>): OrmTestEnvLivePrismaMysql<PrismaClient> {
  dedicated.push(env);
  return env;
}

function release(env: OrmTestEnvLivePrismaMysql<PrismaClient>): void {
  dedicated = dedicated.filter((tracked) => tracked !== env);
}

async function newEnv(): Promise<OrmTestEnvLivePrismaMysql<PrismaClient>> {
  return setupOrmEnv({
    mode: 'live',
    orm: 'prisma',
    dialect: 'mysql',
    prismaClient: PrismaClient,
    schemaPath: SCHEMA_PATH,
  });
}

// 予算は cold pull を含む。 実測は warm で 21.5s、 pull を含めて約 65s。 MySQL は
// 初回 boot で data dir を作るため postgres より重い。 台が遅い日の 4-8 倍
// (#1800 の赤で観測された倍率) を吸えるだけ取る。
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
}, 360_000);

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
async function resetTables(env: OrmTestEnvLivePrismaMysql<PrismaClient>): Promise<void> {
  await env.client.post.deleteMany();
  await env.client.user.deleteMany();
}

afterEach(async () => {
  const envs = dedicated;
  dedicated = [];
  // 1 つが失敗しても残りを止める。 逐次 await だと最初の失敗で残りが leak する。
  const stopped = await Promise.allSettled(envs.map((env) => env.stop()));
  if (shared) await resetTables(shared);
  // 握り潰さない。 止まらなかったことは container が残ったことなので、 hook の失敗として
  // 出す (vitest は test 本体の失敗とは別に報告するため、 元の失敗を隠さない)。
  const failed = stopped.find((result) => result.status === 'rejected');
  if (failed) throw (failed as PromiseRejectedResult).reason;
}, 60_000);

describe('UsersRepository via @kiwa-lab/orm (prisma + testcontainers mysql)', () => {
  // 共有 container を使う test の予算。 container 起動を含まないので query の往復だけ
  // を測る。 大きく取ると、 query が返らない形が 4 分間 見えないままになる。
  const QUERY_BUDGET = 60_000;

  it('T-PM-001: create + findByEmail round-trip on real MySQL via Prisma', async () => {
    if (!shared) return;
    const repo = new UsersRepository(shared.client);
    const created = await repo.create({ email: 'alice@example.com', displayName: 'Alice' });
    expect(created.ok).toBe(true);
    const found = await repo.findByEmail('alice@example.com');
    expect(found?.email).toBe('alice@example.com');
    expect(found?.displayName).toBe('Alice');
  }, QUERY_BUDGET);

  it('T-PM-002: duplicate email returns duplicate-email reason (MySQL P2002)', async () => {
    if (!shared) return;
    await shared.client.user.create({ data: { email: 'alice@example.com', displayName: 'Alice' } });
    const second = await new UsersRepository(shared.client).create({ email: 'alice@example.com', displayName: 'Alice 2' });
    expect(second).toEqual({ ok: false, reason: 'duplicate-email' });
  }, QUERY_BUDGET);

  it('T-PM-003: findByEmail returns null for missing email', async () => {
    if (!shared) return;
    expect(await new UsersRepository(shared.client).findByEmail('nobody@example.com')).toBeNull();
  }, QUERY_BUDGET);

  it('T-PM-004: user delete cascades to posts (MySQL FK onDelete: Cascade)', async () => {
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
  it('T-PM-005: parallel envs are isolated (different containers + URIs)', async () => {
    if (!dockerAvailable) return;
    const envA = track(await newEnv());
    const envB = track(await newEnv());
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
  }, 360_000);

  it('T-PM-006: stop() disconnects PrismaClient + tears down container', async () => {
    if (!dockerAvailable) return;
    const local = track(await newEnv());
    await local.stop();
    release(local); // 自分で止めたので afterEach は触らない。
    // 切断後の query は reject。
    await expect(local.client.user.findMany()).rejects.toBeDefined();
  }, 240_000);

  it('T-PM-007: env.connectionUri は mysql:// 接頭辞を持つ', async () => {
    if (!shared) return;
    expect(shared.connectionUri).toMatch(/^mysql:\/\//);
  }, QUERY_BUDGET);

  it('T-PM-008: seed callback runs before tests see env', async () => {
    if (!dockerAvailable) return;
    const seeded = track(await setupOrmEnv({
      mode: 'live',
      orm: 'prisma',
      dialect: 'mysql',
      prismaClient: PrismaClient,
      schemaPath: SCHEMA_PATH,
      seed: async (client) => {
        await client.user.create({ data: { email: 'seeded@example.com', displayName: 'Seed' } });
      },
    }));
    const found = await seeded.client.user.findUnique({ where: { email: 'seeded@example.com' } });
    expect(found?.displayName).toBe('Seed');
  }, 240_000);
});
