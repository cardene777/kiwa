// PoC tests — @kiwa-lab/orm v0.2.1 (Drizzle + MySQL via testcontainers).
//
// **container は file 内で 1 つを共有する**。 起動 + migration が 10.6 秒かかるのに
// 対し SQL 1 往復は 5-21ms で、 test ごとに立て直すと 1 test の 99.8% が起動待ちに
// なる (#1773 で packages/orm 側を実測)。 各 test は共有 container 上で表を作り直して
// から始める。
//
// 例外は T-MY-008 で、 「別の env が別の container になる」 ことが test の主題なので
// 専用に 2 つ立てる。

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { setupOrmEnv, expectRowCount } from '@kiwa-lab/orm';
import type { OrmTestEnvLiveMysql } from '@kiwa-lab/orm';
import { posts, schema, type Schema } from '../src/schema.js';
import { INITIAL_MIGRATION } from '../src/migration.sql.js';
import { UsersRepository } from '../src/users-repo.js';

let dockerAvailable = false;
/** file 内で共有する container。 docker が無い間は null。 */
let shared: OrmTestEnvLiveMysql<Schema> | null = null;
/** `setupOrmEnv` 自身が migration を適用したか。 reset が走る前に採る。 */
let migrationAppliedBySetup: boolean | null = null;

beforeAll(async () => {
  try {
    const { default: Docker } = await import('dockerode');
    await new Docker().ping();
    dockerAvailable = true;
  } catch {
    dockerAvailable = false;
    return;
  }
  shared = await setupOrmEnv({
    mode: 'live',
    orm: 'drizzle',
    dialect: 'mysql',
    schema,
    migrations: INITIAL_MIGRATION,
  });
  // `setupOrmEnv` が migration を適用したことを、 reset が 1 度も走る前に観測する。
  // test の中で見ると `resetTables` が先に表を作ってしまい、 `setupOrmEnv` が
  // migration を黙って無視する回帰を見逃す。
  //
  // 見るのは 1 文目 (users) / 2 文目 (posts) / 3 文目 (index) の 3 つ。 users だけだと
  // 「先頭の CREATE TABLE しか実行しない」 回帰を見逃す (#1775 review 指摘 1)。
  // `SHOW INDEX FROM posts` は posts が無いと ER_NO_SUCH_TABLE を投げる = 検知したい
  // 状況そのもので例外になり、 suite が skip に落ちて assert に到達しない (実測)。
  // `information_schema` は無い対象を空集合として返すので投げない。
  const [rows] = await shared.raw.query(
    `SELECT
       (SELECT COUNT(*) FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_name = 'users') AS u,
       (SELECT COUNT(*) FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_name = 'posts') AS p,
       (SELECT COUNT(*) FROM information_schema.statistics
         WHERE table_schema = DATABASE() AND table_name = 'posts'
           AND index_name = 'posts_author_idx') AS i`,
  );
  const row = Array.isArray(rows)
    ? (rows[0] as { u: number; p: number; i: number } | undefined)
    : undefined;
  migrationAppliedBySetup = Number(row?.u) === 1 && Number(row?.p) === 1 && Number(row?.i) >= 1;
}, 180_000);

afterAll(async () => {
  await shared?.stop();
  shared = null;
}, 60_000);

// 本体の `splitSqlStatements` と同じ切り方にする。 素の `split(';')` は
// `DEFAULT 'a;b'` のような literal 内の semicolon でも切るため、 `setupOrmEnv` は
// 通るのに `resetTables` だけが壊れた SQL を投げる非対称が生まれる (#1775 review 指摘 2)。
const MIGRATION_STATEMENTS = /;\s*(?:\r?\n|$)/;

/**
 * 共有 container の表を作り直す。
 *
 * `DELETE` ではなく作り直すのは AUTO_INCREMENT を戻すため。 残したままだと、
 * 明示 id を入れない test の期待値が前の test の実行順に依存する。
 *
 * `posts` を先に落とすのは FK の向き (posts → users) に従うため。
 * `SET FOREIGN_KEY_CHECKS` は session 単位の設定で `raw` は接続 pool なので、
 * 検査を切ったままの接続が pool に残ると後続の FK 検証が黙って無効化される。
 */
async function resetTables(target: OrmTestEnvLiveMysql<Schema>): Promise<void> {
  await target.raw.query('DROP TABLE IF EXISTS posts');
  await target.raw.query('DROP TABLE IF EXISTS users');
  for (const stmt of INITIAL_MIGRATION.split(MIGRATION_STATEMENTS)) {
    const sql = stmt.trim();
    if (sql.length > 0) await target.raw.query(sql);
  }
}

/** 共有 container を綺麗な状態で受け取る。 docker が無ければ null。 */
async function fresh(): Promise<OrmTestEnvLiveMysql<Schema> | null> {
  if (!dockerAvailable || shared === null) return null;
  await resetTables(shared);
  return shared;
}

describe('UsersRepository via @kiwa-lab/orm (mysql testcontainers)', () => {
  it('T-MY-001: create + findByEmail round-trip on real MySQL', async () => {
    const env = await fresh();
    if (env === null) return;
    // migration を適用したのは `setupOrmEnv` であって `resetTables` ではない。
    expect(migrationAppliedBySetup, 'setupOrmEnv が migration を適用した').toBe(true);
    const repo = new UsersRepository(env.db);
    const created = await repo.create({ email: 'alice@example.com', displayName: 'Alice' });
    expect(created.ok).toBe(true);
    const found = await repo.findByEmail('alice@example.com');
    expect(found?.email).toBe('alice@example.com');
    expect(found?.displayName).toBe('Alice');
  }, 180_000);

  it('T-MY-002: duplicate email returns duplicate-email reason (real MySQL UNIQUE)', async () => {
    const env = await fresh();
    if (env === null) return;
    await env.db.insert(schema.users).values({ email: 'alice@example.com', displayName: 'Alice' });
    const second = await new UsersRepository(env.db).create({ email: 'alice@example.com', displayName: 'Alice 2' });
    expect(second).toEqual({ ok: false, reason: 'duplicate-email' });
  }, 180_000);

  it('T-MY-003: findByEmail returns null for missing email', async () => {
    const env = await fresh();
    if (env === null) return;
    expect(await new UsersRepository(env.db).findByEmail('nobody@example.com')).toBeNull();
  }, 180_000);

  it('T-MY-004: user delete cascades to posts (real MySQL InnoDB FK)', async () => {
    const env = await fresh();
    if (env === null) return;
    await env.db.insert(schema.users).values({ id: 1, email: 'a@x', displayName: 'A' });
    await env.db.insert(schema.posts).values([
      { id: 10, authorId: 1, title: 'p1', published: false },
      { id: 11, authorId: 1, title: 'p2', published: true },
    ]);
    const result = await new UsersRepository(env.db).deleteCascading(1);
    expect(result.deletedPosts).toBe(2);
    await expectRowCount(env, 'posts', 0, expect);
    await expectRowCount(env, 'users', 0, expect);
  }, 180_000);

  it('T-MY-005: other user posts survive cascade delete', async () => {
    const env = await fresh();
    if (env === null) return;
    await env.db.insert(schema.users).values([
      { id: 1, email: 'a@x', displayName: 'A' },
      { id: 2, email: 'b@x', displayName: 'B' },
    ]);
    await env.db.insert(schema.posts).values([
      { id: 10, authorId: 1, title: 'p1', published: false },
      { id: 20, authorId: 2, title: 'p2', published: true },
    ]);
    await new UsersRepository(env.db).deleteCascading(1);
    const remaining = await env.db.select().from(posts);
    expect(remaining.length).toBe(1);
    expect(remaining[0]?.authorId).toBe(2);
  }, 180_000);

  it('T-MY-006: case-insensitive email filter (MySQL utf8mb4_0900_ai_ci default)', async () => {
    const env = await fresh();
    if (env === null) return;
    await env.db.insert(schema.users).values({ id: 1, email: 'alice@example.com', displayName: 'Alice' });
    // MySQL default collation utf8mb4_0900_ai_ci is case-insensitive, so both queries match.
    const upper = await env.db.select().from(schema.users).where(eq(schema.users.email, 'ALICE@EXAMPLE.COM'));
    const lower = await env.db.select().from(schema.users).where(eq(schema.users.email, 'alice@example.com'));
    expect(upper.length).toBe(1);
    expect(lower.length).toBe(1);
  }, 180_000);

  it('T-MY-007: orphan post insert rejects with MySQL FK violation', async () => {
    const env = await fresh();
    if (env === null) return;
    await expect(
      env.db.insert(schema.posts).values({ id: 99, authorId: 999, title: 'orphan', published: false }),
    ).rejects.toThrow(/foreign key constraint fails/);
  }, 180_000);

  it('T-MY-008: parallel envs are isolated (different containers)', async () => {
    if (!dockerAvailable) return;
    // 「別の env が別の container になる」 ことが主題なので、 この test だけ専用に 2 つ立てる。
    //
    // 宣言を try の外に置き、 起動も try の中で行う。 外で起動すると envB の起動が失敗した
    // 時に envA が残り、 finally を逐次にすると envA.stop() の失敗で envB が残る
    // (#1775 review 指摘 3)。
    let envA: OrmTestEnvLiveMysql<Schema> | null = null;
    let envB: OrmTestEnvLiveMysql<Schema> | null = null;
    try {
      envA = await setupOrmEnv({
        mode: 'live', orm: 'drizzle', dialect: 'mysql', schema, migrations: INITIAL_MIGRATION,
        seed: async (db) => {
          await db.insert(schema.users).values({ id: 1, email: 'a@x', displayName: 'Alice in A' });
        },
      });
      envB = await setupOrmEnv({
        mode: 'live', orm: 'drizzle', dialect: 'mysql', schema, migrations: INITIAL_MIGRATION,
        seed: async (db) => {
          await db.insert(schema.users).values({ id: 1, email: 'a@x', displayName: 'Alice in B' });
        },
      });
      const a = (await envA.db.select().from(schema.users))[0];
      const b = (await envB.db.select().from(schema.users))[0];
      expect(a?.displayName).toBe('Alice in A');
      expect(b?.displayName).toBe('Alice in B');
      expect(envA.connectionUri).not.toBe(envB.connectionUri);
    } finally {
      // 片方の stop が失敗しても、 もう片方を必ず試す。
      const settled = await Promise.allSettled([envA?.stop(), envB?.stop()]);
      const failed = settled.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        throw new AggregateError(
          failed.map((r) => (r as PromiseRejectedResult).reason),
          'container の後始末に失敗した',
        );
      }
    }
  }, 240_000);
});
