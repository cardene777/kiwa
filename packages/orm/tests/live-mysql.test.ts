// Live-mode tests for @kiwa-lab/orm v0.2.1 (Drizzle + MySQL via testcontainers).
//
// Mirrors live-mode.test.ts (Postgres). MySQL 固有の振る舞い (collation /
// AUTO_INCREMENT / FK 強制) に絞る。
//
// **container は file 内で 1 つを共有する**。 起動 + migration が 10.6 秒かかるのに
// 対し SQL 1 往復は 5-21ms で、 test ごとに立て直すと 1 test の 99.8% が起動待ちになる
// (実測 = 7 test で 76 秒、 うち SQL は 0.1 秒未満)。 各 test は共有 container 上で
// 表を作り直してから始める。
//
// 例外は `setupOrmEnv` 自身の生存期間を見る 2 件 (seed callback / stop) で、 これらは
// 共有 container では確かめられないため専用に立てる。
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { mysqlTable, int, varchar, index } from 'drizzle-orm/mysql-core';
import { setupOrmEnv, expectQuery, expectRowCount } from '../src/index.js';
import type { OrmTestEnvLiveMysql } from '../src/index.js';

const users = mysqlTable(
  'users',
  {
    id: int('id').autoincrement().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    parentId: int('parent_id'),
  },
  (t) => ({ emailIdx: index('users_email_idx').on(t.email) }),
);
const schema = { users };
type AppSchema = typeof schema;

const MIGRATION = `
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  parent_id INT NULL,
  CONSTRAINT users_parent_fk FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX users_email_idx ON users(email);
`;

let dockerAvailable = false;
/** file 内で共有する container。 docker が無い間は null。 */
let shared: OrmTestEnvLiveMysql<AppSchema> | null = null;
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
    migrations: MIGRATION,
  });
  // `setupOrmEnv` が migration を適用したことを、 reset が 1 度も走る前に観測する。
  //
  // T-ORM-201 の中で見ると `resetTables` が先に表を作ってしまうため、 `setupOrmEnv`
  // が migration を黙って無視する回帰を見逃す (#1773 review 指摘 2)。 ここで採れば
  // test の実行順にも `.only` にも依存しない。
  const [tables] = await shared.raw.query("SHOW TABLES LIKE 'users'");
  migrationAppliedBySetup = Array.isArray(tables) && tables.length === 1;
}, 180_000);

afterAll(async () => {
  await shared?.stop();
  shared = null;
}, 60_000);

/**
 * 共有 container の表を作り直す。
 *
 * `DELETE` ではなく作り直すのは AUTO_INCREMENT を戻すため。 残したままだと、
 * 明示 id を入れない test の期待値が前の test の実行順に依存する。
 */
async function resetTables(env: OrmTestEnvLiveMysql<AppSchema>): Promise<void> {
  // `SET FOREIGN_KEY_CHECKS` は session 単位の設定で、 `raw` は接続 pool。
  // 3 文が別々の接続に飛ぶと、 検査を切ったままの接続が pool に残り、 後続 test の
  // FK 検証 (T-ORM-205) が黙って無効化される。 唯一の FK は users の自己参照で、
  // 表ごと落とす分には検査を切る必要がないので使わない。
  await env.raw.query('DROP TABLE IF EXISTS users');
  for (const stmt of MIGRATION.split(';')) {
    const sql = stmt.trim();
    if (sql.length > 0) await env.raw.query(sql);
  }
}

/** 共有 container を綺麗な状態で受け取る。 docker が無ければ null。 */
async function fresh(): Promise<OrmTestEnvLiveMysql<AppSchema> | null> {
  if (!dockerAvailable || shared === null) return null;
  await resetTables(shared);
  return shared;
}

/** `setupOrmEnv` 自身の生存期間を見る test 専用の container。 */
let dedicated: OrmTestEnvLiveMysql<AppSchema> | null = null;
afterEach(async () => {
  if (dedicated !== null) {
    await dedicated.stop();
    dedicated = null;
  }
}, 60_000);

describe('setupOrmEnv (drizzle + mysql + testcontainers)', () => {
  it('T-ORM-201: container starts, migration applies, insert + select round-trip', async () => {
    const env = await fresh();
    if (env === null) return;
    expect(env.connectionUri).toMatch(/^mysql:\/\//);
    // migration を適用したのは `setupOrmEnv` であって `resetTables` ではない。
    expect(migrationAppliedBySetup, 'setupOrmEnv が migration を適用した').toBe(true);
    await env.db.insert(users).values({ id: 1, email: 'alice@example.com', parentId: null });
    const rows = await env.db.select().from(users);
    expect(rows).toEqual([{ id: 1, email: 'alice@example.com', parentId: null }]);
  }, 180_000);

  it('T-ORM-202: seed callback runs with live drizzle client', async () => {
    if (!dockerAvailable) return;
    // seed は `setupOrmEnv` の中で migration の直後に走る。 共有 container では
    // その順序を確かめられないため、 この test だけ専用に立てる。
    dedicated = await setupOrmEnv({
      mode: 'live',
      orm: 'drizzle',
      dialect: 'mysql',
      schema,
      migrations: MIGRATION,
      seed: async (db) => {
        await db.insert(users).values({ id: 10, email: 'seeded@example.com', parentId: null });
      },
    });
    const rows = await dedicated.db.select().from(users);
    expect(rows.length).toBe(1);
    expect(rows[0]?.email).toBe('seeded@example.com');
  }, 180_000);

  it('T-ORM-203: where + eq narrows to a single row (real MySQL parser)', async () => {
    const env = await fresh();
    if (env === null) return;
    await env.db.insert(users).values([
      { id: 1, email: 'a@x', parentId: null },
      { id: 2, email: 'b@x', parentId: null },
    ]);
    const rows = await env.db.select().from(users).where(eq(users.email, 'b@x'));
    expect(rows).toEqual([{ id: 2, email: 'b@x', parentId: null }]);
  }, 180_000);

  it('T-ORM-204: UNIQUE constraint violation rejects with MySQL ER_DUP_ENTRY', async () => {
    const env = await fresh();
    if (env === null) return;
    await env.db.insert(users).values({ id: 1, email: 'dup@x', parentId: null });
    await expect(
      env.db.insert(users).values({ id: 2, email: 'dup@x', parentId: null }),
    ).rejects.toThrow(/Duplicate entry/);
  }, 180_000);

  it('T-ORM-205: FK ON DELETE SET NULL takes effect (real MySQL InnoDB)', async () => {
    const env = await fresh();
    if (env === null) return;
    await env.db.insert(users).values({ id: 1, email: 'parent@x', parentId: null });
    await env.db.insert(users).values({ id: 2, email: 'child@x', parentId: 1 });
    await env.db.delete(users).where(eq(users.id, 1));
    const remaining = await env.db.select().from(users);
    expect(remaining).toEqual([{ id: 2, email: 'child@x', parentId: null }]);
  }, 180_000);

  it('T-ORM-206: expectRowCount + expectQuery helpers work over mysql2', async () => {
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
  }, 180_000);

  it('T-ORM-207: stop() closes the pool + tears down the container', async () => {
    if (!dockerAvailable) return;
    // 落とすところまで見る test なので共有 container は使えない。
    const local = await setupOrmEnv({
      mode: 'live',
      orm: 'drizzle',
      dialect: 'mysql',
      schema,
      migrations: MIGRATION,
    });
    await local.stop();
    // Re-running a query against the now-closed pool must fail.
    await expect(local.raw.query('SELECT 1')).rejects.toBeDefined();
  }, 180_000);
});
