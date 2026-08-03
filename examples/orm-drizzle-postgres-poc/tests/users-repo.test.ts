// PoC tests — @kiwa-lab/orm v0.2 (Drizzle + Postgres via testcontainers).
//
// **container は file 内で 1 つを共有する**。 起動 + migration が数秒かかるのに対し
// SQL 1 往復は 10ms 未満で、 test ごとに立て直すとほぼ全部が起動待ちになる
// (#1773 で packages/orm 側を実測)。 各 test は共有 container 上で表を作り直して
// から始める。
//
// 例外は T-PG-008 で、 「別の env が別の container になる」 ことが test の主題なので
// 専用に 2 つ立てる。

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { setupOrmEnv, expectRowCount } from '@kiwa-lab/orm';
import type { OrmTestEnvLive } from '@kiwa-lab/orm';
import { posts, schema, type Schema } from '../src/schema.js';
import { INITIAL_MIGRATION } from '../src/migration.sql.js';
import { UsersRepository } from '../src/users-repo.js';

let dockerAvailable = false;
/** file 内で共有する container。 docker が無い間は null。 */
let shared: OrmTestEnvLive<Schema> | null = null;
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
    dialect: 'postgres',
    schema,
    migrations: INITIAL_MIGRATION,
  });
  // `setupOrmEnv` が migration を適用したことを、 reset が 1 度も走る前に観測する。
  // test の中で見ると `resetTables` が先に表を作ってしまい、 `setupOrmEnv` が
  // migration を黙って無視する回帰を見逃す。
  //
  // 見るのは 1 文目 (users) / 2 文目 (posts) / 3 文目 (index) の 3 つ。 users だけだと
  // 「先頭の CREATE TABLE しか実行しない」 回帰を見逃す (#1775 review 指摘 1)。
  // FK は `REFERENCES` の inline 記法で名前を持たないため、 posts の存在で代替する。
  const found = await shared.raw.unsafe(
    "SELECT to_regclass('public.users') AS u, to_regclass('public.posts') AS p, to_regclass('public.posts_author_idx') AS i",
  );
  const row = Array.from(
    found as unknown as Iterable<{ u: string | null; p: string | null; i: string | null }>,
  )[0];
  migrationAppliedBySetup = row?.u === 'users' && row?.p === 'posts' && row?.i === 'posts_author_idx';
}, 120_000);

afterAll(async () => {
  await shared?.stop();
  shared = null;
}, 30_000);

// 本体の `splitSqlStatements` と同じ切り方にする。 素の `split(';')` は
// `DEFAULT 'a;b'` のような literal 内の semicolon でも切るため、 `setupOrmEnv` は
// 通るのに `resetTables` だけが壊れた SQL を投げる非対称が生まれる (#1775 review 指摘 2)。
const MIGRATION_STATEMENTS = /;\s*(?:\r?\n|$)/;

/**
 * 共有 container の表を作り直す。
 *
 * `DELETE` ではなく作り直すのは SERIAL の採番を戻すため。 残したままだと、
 * 明示 id を入れない test の期待値が前の test の実行順に依存する。
 */
async function resetTables(target: OrmTestEnvLive<Schema>): Promise<void> {
  await target.raw.unsafe('DROP TABLE IF EXISTS posts CASCADE');
  await target.raw.unsafe('DROP TABLE IF EXISTS users CASCADE');
  for (const stmt of INITIAL_MIGRATION.split(MIGRATION_STATEMENTS)) {
    const sql = stmt.trim();
    if (sql.length > 0) await target.raw.unsafe(sql);
  }
}

/** 共有 container を綺麗な状態で受け取る。 docker が無ければ null。 */
async function fresh(): Promise<OrmTestEnvLive<Schema> | null> {
  if (!dockerAvailable || shared === null) return null;
  await resetTables(shared);
  return shared;
}

describe('UsersRepository via @kiwa-lab/orm (postgres testcontainers)', () => {
  it('T-PG-001: create + findByEmail round-trip on real Postgres', async () => {
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
  }, 120_000);

  it('T-PG-002: duplicate email returns duplicate-email reason (real Postgres UNIQUE)', async () => {
    const env = await fresh();
    if (env === null) return;
    await env.db.insert(schema.users).values({ email: 'alice@example.com', displayName: 'Alice' });
    const second = await new UsersRepository(env.db).create({ email: 'alice@example.com', displayName: 'Alice 2' });
    expect(second).toEqual({ ok: false, reason: 'duplicate-email' });
  }, 120_000);

  it('T-PG-003: findByEmail returns null for missing email', async () => {
    const env = await fresh();
    if (env === null) return;
    expect(await new UsersRepository(env.db).findByEmail('nobody@example.com')).toBeNull();
  }, 120_000);

  it('T-PG-004: user delete cascades to posts (real Postgres FK)', async () => {
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
  }, 120_000);

  it('T-PG-005: other user posts survive cascade delete', async () => {
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
  }, 120_000);

  it('T-PG-006: case-sensitive email filter (real Postgres collation default)', async () => {
    const env = await fresh();
    if (env === null) return;
    await env.db.insert(schema.users).values({ id: 1, email: 'alice@example.com', displayName: 'Alice' });
    const upper = await env.db.select().from(schema.users).where(eq(schema.users.email, 'ALICE@EXAMPLE.COM'));
    const lower = await env.db.select().from(schema.users).where(eq(schema.users.email, 'alice@example.com'));
    expect(upper.length).toBe(0);
    expect(lower.length).toBe(1);
  }, 120_000);

  it('T-PG-007: orphan post insert rejects with Postgres FK violation', async () => {
    const env = await fresh();
    if (env === null) return;
    await expect(
      env.db.insert(schema.posts).values({ id: 99, authorId: 999, title: 'orphan', published: false }),
    ).rejects.toThrow(/violates foreign key constraint/);
  }, 120_000);

  it('T-PG-008: parallel envs are isolated (different containers)', async () => {
    if (!dockerAvailable) return;
    // 「別の env が別の container になる」 ことが主題なので、 この test だけ専用に 2 つ立てる。
    //
    // 宣言を try の外に置き、 起動も try の中で行う。 外で起動すると envB の起動が失敗した
    // 時に envA が残り、 finally を逐次にすると envA.stop() の失敗で envB が残る
    // (#1775 review 指摘 3)。
    let envA: OrmTestEnvLive<Schema> | null = null;
    let envB: OrmTestEnvLive<Schema> | null = null;
    try {
      envA = await setupOrmEnv({
        mode: 'live', orm: 'drizzle', dialect: 'postgres', schema, migrations: INITIAL_MIGRATION,
        seed: async (db) => {
          await db.insert(schema.users).values({ id: 1, email: 'a@x', displayName: 'Alice in A' });
        },
      });
      envB = await setupOrmEnv({
        mode: 'live', orm: 'drizzle', dialect: 'postgres', schema, migrations: INITIAL_MIGRATION,
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
  }, 180_000);
});
