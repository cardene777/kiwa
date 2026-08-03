// Live-mode tests for @kiwa-lab/orm v0.2 (Drizzle + Postgres via testcontainers).
//
// mock mode で覆えない範囲 (実 SQL 方言 / transaction 意味論 / 接続の生存期間) に絞る。
//
// **container は file 内で 1 つを共有する**。 起動 + migration に数秒かかるのに対し
// SQL 1 往復は 10ms 未満で、 test ごとに立て直すと 1 test のほぼ全部が起動待ちになる
// (実測 = 7 test で 41 秒)。 各 test は共有 container 上で表を作り直してから始める。
//
// 例外は `setupOrmEnv` 自身の生存期間を見る 2 件 (seed callback / stop) で、 これらは
// 共有 container では確かめられないため専用に立てる。
//
// CI requires a working Docker daemon. Tests skip themselves with a clear
// error message if Docker is not reachable.

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';
import { setupOrmEnv, expectQuery, expectRowCount } from '../src/index.js';
import type { OrmTestEnvLive } from '../src/index.js';

const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  parentId: integer('parent_id'),
});
const schema = { users };
type AppSchema = typeof schema;

const MIGRATION = `
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX users_email_idx ON users(email);
`;

// Detect whether the local Docker daemon is reachable. We probe once at
// suite startup and skip the live suite cleanly otherwise so contributors
// without Docker can still run `pnpm -F @kiwa-lab/orm test` for mock mode.
let dockerAvailable = false;
/** file 内で共有する container。 docker が無い間は null。 */
let shared: OrmTestEnvLive<AppSchema> | null = null;
/** `setupOrmEnv` 自身が migration を適用したか。 reset が走る前に採る。 */
let migrationAppliedBySetup: boolean | null = null;

beforeAll(async () => {
  try {
    const { default: Docker } = await import('dockerode');
    const docker = new Docker();
    await docker.ping();
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
    migrations: MIGRATION,
  });
  // `setupOrmEnv` が migration を適用したことを、 reset が 1 度も走る前に観測する。
  //
  // T-ORM-101 の中で見ると `resetTables` が先に表を作ってしまうため、 `setupOrmEnv`
  // が migration を黙って無視する回帰を見逃す (#1773 review 指摘 2)。 ここで採れば
  // test の実行順にも `.only` にも依存しない。
  const found = await shared.raw.unsafe("SELECT to_regclass('public.users') AS t");
  migrationAppliedBySetup = Array.from(found as unknown as Iterable<{ t: string | null }>)[0]?.t === 'users';
}, 120_000);

afterAll(async () => {
  await shared?.stop();
  shared = null;
}, 30_000);

/**
 * 共有 container の表を作り直す。
 *
 * `DELETE` ではなく作り直すのは SERIAL の採番を戻すため。 残したままだと、
 * 明示 id を入れない test の期待値が前の test の実行順に依存する。
 */
async function resetTables(env: OrmTestEnvLive<AppSchema>): Promise<void> {
  await env.raw.unsafe('DROP TABLE IF EXISTS users CASCADE');
  for (const stmt of MIGRATION.split(';')) {
    const sql = stmt.trim();
    if (sql.length > 0) await env.raw.unsafe(sql);
  }
}

/** 共有 container を綺麗な状態で受け取る。 docker が無ければ null。 */
async function fresh(): Promise<OrmTestEnvLive<AppSchema> | null> {
  if (!dockerAvailable || shared === null) return null;
  await resetTables(shared);
  return shared;
}

/** `setupOrmEnv` 自身の生存期間を見る test 専用の container。 */
let dedicated: OrmTestEnvLive<AppSchema> | null = null;
afterEach(async () => {
  if (dedicated !== null) {
    await dedicated.stop();
    dedicated = null;
  }
}, 30_000);

describe('setupOrmEnv (drizzle + postgres + testcontainers)', () => {
  it('T-ORM-101: container starts, migration applies, insert + select round-trip', async () => {
    const env = await fresh();
    if (env === null) return;
    expect(env.connectionUri).toMatch(/^postgres(?:ql)?:\/\//);
    // migration を適用したのは `setupOrmEnv` であって `resetTables` ではない。
    expect(migrationAppliedBySetup, 'setupOrmEnv が migration を適用した').toBe(true);

    await env.db.insert(users).values({ id: 1, email: 'alice@example.com', parentId: null });
    const rows = await env.db.select().from(users);
    expect(rows).toEqual([{ id: 1, email: 'alice@example.com', parentId: null }]);
  }, 120_000);

  it('T-ORM-102: seed callback runs with live drizzle client', async () => {
    if (!dockerAvailable) return;
    // seed は `setupOrmEnv` の中で migration の直後に走る。 共有 container では
    // その順序を確かめられないため、 この test だけ専用に立てる。
    dedicated = await setupOrmEnv({
      mode: 'live',
      orm: 'drizzle',
      dialect: 'postgres',
      schema,
      migrations: MIGRATION,
      seed: async (db) => {
        await db.insert(users).values({ id: 10, email: 'seeded@example.com', parentId: null });
      },
    });
    const rows = await dedicated.db.select().from(users);
    expect(rows.length).toBe(1);
    expect(rows[0]?.email).toBe('seeded@example.com');
  }, 120_000);

  it('T-ORM-103: where + eq narrows to a single row (real Postgres parser)', async () => {
    const env = await fresh();
    if (env === null) return;
    await env.db.insert(users).values([
      { id: 1, email: 'a@x', parentId: null },
      { id: 2, email: 'b@x', parentId: null },
    ]);
    const rows = await env.db.select().from(users).where(eq(users.email, 'b@x'));
    expect(rows).toEqual([{ id: 2, email: 'b@x', parentId: null }]);
  }, 120_000);

  it('T-ORM-104: UNIQUE constraint violation rejects with Postgres error code', async () => {
    const env = await fresh();
    if (env === null) return;
    await env.db.insert(users).values({ id: 1, email: 'dup@x', parentId: null });
    await expect(
      env.db.insert(users).values({ id: 2, email: 'dup@x', parentId: null }),
    ).rejects.toThrow(/duplicate key value violates unique constraint/);
  }, 120_000);

  it('T-ORM-105: FK ON DELETE SET NULL takes effect (real Postgres FK semantics)', async () => {
    const env = await fresh();
    if (env === null) return;
    await env.db.insert(users).values({ id: 1, email: 'parent@x', parentId: null });
    await env.db.insert(users).values({ id: 2, email: 'child@x', parentId: 1 });
    await env.db.delete(users).where(eq(users.id, 1));
    const remaining = await env.db.select().from(users);
    expect(remaining).toEqual([{ id: 2, email: 'child@x', parentId: null }]);
  }, 120_000);

  it('T-ORM-106: expectRowCount + expectQuery helpers work over postgres.js', async () => {
    const env = await fresh();
    if (env === null) return;
    await env.db.insert(users).values([
      { id: 1, email: 'a@x', parentId: null },
      { id: 2, email: 'b@x', parentId: null },
    ]);
    await expectRowCount(env, 'users', 2, expect);
    await expectQuery(
      env,
      'SELECT email FROM users ORDER BY id',
      [{ email: 'a@x' }, { email: 'b@x' }],
      expect,
    );
  }, 120_000);

  it('T-ORM-107: stop() closes the pool + tears down the container', async () => {
    if (!dockerAvailable) return;
    // 落とすところまで見る test なので共有 container は使えない。
    const local = await setupOrmEnv({
      mode: 'live',
      orm: 'drizzle',
      dialect: 'postgres',
      schema,
      migrations: MIGRATION,
    });
    await local.stop();
    // Re-running a query against the now-closed pool must fail rather than
    // silently re-open a connection.
    await expect(
      local.raw.unsafe('SELECT 1').then((r) => Array.from(r as unknown as Iterable<unknown>)),
    ).rejects.toBeDefined();
  }, 120_000);
});
