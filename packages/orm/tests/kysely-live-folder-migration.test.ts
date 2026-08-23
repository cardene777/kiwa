/**
 * `setupOrmEnv` の kysely + live 2 本のうち、 folder migration と seed の枝の検査 (Issue #2170)。
 *
 * `kysely-live-setup.test.ts` (#2161) は inline SQL の枝まで覆っていたが、
 * `migrations: { folder }` を渡した時に Migrator を通す枝と、 mysql 側の seed は
 * coverage 上 **実行回数 0** のまま残っていた。
 *
 * ## 何を差し替えるか
 *
 * container (`@testcontainers/*`) と driver (`pg` / `mysql2/promise`) だけ。
 * **kysely は実物を使う**。 Migrator も FileMigrationProvider も実物が動くので、
 * 「folder を読んで migration の DDL を driver へ流したか」 を driver 側の記録で見る。
 *
 * ## 2 経路の見分け方
 *
 * inline SQL は `env.raw` (driver の pool) へ直接流れ、 folder migration は kysely が
 * 握る connection を通る。 記録先を分けておくと、 経路を取り違えた実装では
 * 片方が空になる。 適用結果だけを見ると 2 経路の区別が付かない。
 */
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Kysely } from 'kysely';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class FakePostgresContainer {
  stopped = false;
  constructor(public readonly image: string) {}
  async start(): Promise<FakePostgresContainer> {
    return this;
  }
  getConnectionUri(): string {
    return 'postgres://user:pass@127.0.0.1:55432/test';
  }
  async stop(): Promise<void> {
    this.stopped = true;
  }
}

class FakeMySqlContainer {
  stopped = false;
  constructor(public readonly image: string) {}
  async start(): Promise<FakeMySqlContainer> {
    return this;
  }
  getConnectionUri(): string {
    return 'mysql://user:pass@127.0.0.1:33306/test';
  }
  async stop(): Promise<void> {
    this.stopped = true;
  }
}

vi.mock('@testcontainers/postgresql', () => ({ PostgreSqlContainer: FakePostgresContainer }));
vi.mock('@testcontainers/mysql', () => ({ MySqlContainer: FakeMySqlContainer }));

/** driver へ届いた 1 回分。 値は placeholder で渡るため SQL 文だけでは足りない。 */
interface DriverCall {
  readonly sql: string;
  readonly params: readonly unknown[];
}

/** `sql` に部分一致する呼出の値を全て集める。 */
function paramsOf(calls: readonly DriverCall[], fragment: string): unknown[] {
  return calls.filter((c) => c.sql.includes(fragment)).flatMap((c) => [...c.params]);
}

const __pgPools: FakePgPool[] = [];

class FakePgPool {
  /** `env.raw` から直接流れた SQL (inline SQL 経路)。 */
  readonly directQueries: string[] = [];
  /** kysely が握る connection を通った呼出 (Migrator / query builder 経路)。 */
  readonly driverCalls: DriverCall[] = [];
  ended = false;
  constructor(public readonly config: { connectionString: string; max?: number }) {
    __pgPools.push(this);
  }
  get driverQueries(): string[] {
    return this.driverCalls.map((c) => c.sql);
  }
  async query(sql: string): Promise<{ rows: never[] }> {
    this.directQueries.push(sql);
    return { rows: [] };
  }
  async end(): Promise<void> {
    this.ended = true;
  }
  async connect(): Promise<{
    query: (sql: string, params?: readonly unknown[]) => Promise<{ command: string; rowCount: number; rows: never[] }>;
    release: () => void;
  }> {
    return {
      query: async (sql: string, params: readonly unknown[] = []) => {
        this.driverCalls.push({ sql, params });
        return { command: 'SELECT', rowCount: 0, rows: [] };
      },
      release: () => undefined,
    };
  }
}

/**
 * `pg` は `Pool` を名前付きと `default` の両方から出す。 実装は `default?.Pool` を
 * 先に見るため、 両方置く (片方を消すと vitest がその export を持たない mock として
 * throw し、 実装の分岐まで届かない)。
 */
vi.mock('pg', () => ({ Pool: FakePgPool, default: { Pool: FakePgPool } }));

const __mysqlPools: FakeMysqlPool[] = [];

class FakeMysqlPool {
  /** `env.raw` から直接流れた SQL (inline SQL 経路)。 */
  readonly directQueries: string[] = [];
  /** kysely が握る callback connection を通った呼出。 */
  readonly driverCalls: DriverCall[] = [];
  ended = false;
  releases = 0;
  get driverQueries(): string[] {
    return this.driverCalls.map((c) => c.sql);
  }
  /** `mysql2/promise` は callback 版の pool を `.pool` に持つ。 kysely はこちらを使う。 */
  readonly pool = {
    getConnection: (
      callback: (
        error: Error | null,
        connection: {
          query: (sql: string, params: readonly unknown[], done: (error: Error | null, rows: never[]) => void) => void;
          release: () => void;
        },
      ) => void,
    ): void => {
      callback(null, {
        query: (sql, params, done) => {
          this.driverCalls.push({ sql, params: params ?? [] });
          done(null, []);
        },
        release: () => {
          this.releases += 1;
        },
      });
    },
  };
  constructor(public readonly uri: string) {
    __mysqlPools.push(this);
  }
  async query(sql: string): Promise<[never[], never[]]> {
    this.directQueries.push(sql);
    return [[], []];
  }
  async end(): Promise<void> {
    this.ended = true;
  }
}

const __createPool = (uri: string): FakeMysqlPool => new FakeMysqlPool(uri);
vi.mock('mysql2/promise', () => ({ createPool: __createPool, default: { createPool: __createPool } }));

const { setupOrmEnv } = await import('../src/index.js');

interface Db {
  users: { id: number; email: string };
}

/** この経路が返す形。 `setupOrmEnv` の戻り値は union なので呼出側で絞る。 */
interface KyselyLiveEnv {
  db: Kysely<Db>;
  raw: FakePgPool | FakeMysqlPool;
  connectionUri: string;
  stop: () => Promise<void>;
}

async function setupKysely(
  dialect: 'postgres' | 'mysql',
  overrides: Record<string, unknown> = {},
): Promise<KyselyLiveEnv> {
  const env = await setupOrmEnv({
    mode: 'live',
    orm: 'kysely',
    dialect,
    ...overrides,
  } as unknown as Parameters<typeof setupOrmEnv>[0]);
  return env as unknown as KyselyLiveEnv;
}

let tmp: string | null = null;
let stopEnv: (() => Promise<void>) | null = null;

/**
 * kysely の Migrator が読む形の folder を書く。
 *
 * 適用順は file 名の辞書順。 2 本目が 1 本目の表に依存するので、 順序が入れ替われば
 * driver へ届く SQL の並びも変わる。
 */
async function writeMigrationFolder(): Promise<string> {
  tmp = await mkdtemp(join(tmpdir(), 'kiwa-kysely-live-migrator-'));
  await writeFile(
    join(tmp, '20260101_create_users.mjs'),
    `export async function up(db) {
  await db.schema
    .createTable('folder_users')
    .addColumn('id', 'integer', (c) => c.primaryKey())
    .addColumn('email', 'varchar(255)', (c) => c.notNull())
    .execute();
}
export async function down(db) {
  await db.schema.dropTable('folder_users').execute();
}
`,
  );
  await writeFile(
    join(tmp, '20260102_add_index.mjs'),
    `export async function up(db) {
  await db.schema.createIndex('folder_users_email_idx').on('folder_users').column('email').execute();
}
export async function down(db) {
  await db.schema.dropIndex('folder_users_email_idx').execute();
}
`,
  );
  return tmp;
}

beforeEach(() => {
  __pgPools.length = 0;
  __mysqlPools.length = 0;
});

afterEach(async () => {
  if (stopEnv !== null) {
    await stopEnv();
    stopEnv = null;
  }
  if (tmp !== null) {
    await rm(tmp, { recursive: true, force: true });
    tmp = null;
  }
});

describe('setupOrmEnv — kysely + live + postgres の folder migration (#2170)', () => {
  it('T-KLF-001 folder の migration を順に適用し、 台帳へ記録する', async () => {
    const folder = await writeMigrationFolder();
    const env = await setupKysely('postgres', { migrations: { folder } });
    stopEnv = env.stop;
    const raw = env.raw as FakePgPool;
    const flowed = raw.driverQueries.join('\n');

    // 台帳は Migrator だけが作る。 inline SQL 経路には無い。
    expect(flowed, '台帳表を作る').toContain('kysely_migration');
    // migration file の中身が届いていないと、 folder を読めていない。
    expect(flowed, '1 本目が届く').toContain('create table "folder_users"');
    expect(flowed, '2 本目が届く').toContain('create index "folder_users_email_idx"');
    // 適用済として名前を残さないと、 次回に同じ migration を再適用する。
    // 名前は placeholder で渡るため SQL 文ではなく値の側を見る。
    const recorded = paramsOf(raw.driverCalls, 'insert into "kysely_migration"');
    expect(recorded, '1 本目を適用済として書き込む').toContain('20260101_create_users');
    expect(recorded, '2 本目を適用済として書き込む').toContain('20260102_add_index');
    // 順序は file 名の辞書順。 逆だと index を作る先の表がまだ無い。
    expect(
      flowed.indexOf('create table "folder_users"'),
      '表を作ってから index を作る',
    ).toBeLessThan(flowed.indexOf('create index "folder_users_email_idx"'));
    // folder 経路は pool へ直接流さない。 流れていたら 2 経路を取り違えている。
    expect(raw.directQueries, 'inline SQL 経路は通らない').toHaveLength(0);
  });

  it('T-KLF-002 inline SQL は pool へ直接流し、 台帳は作らない', async () => {
    // T-KLF-001 との差は `migrations` の形だけ。 2 経路が同じ記録先に落ちていないことを見る。
    const env = await setupKysely('postgres', {
      migrations: 'CREATE TABLE inline_users (id SERIAL);\nCREATE INDEX inline_users_id_idx ON inline_users(id);',
    });
    stopEnv = env.stop;
    const raw = env.raw as FakePgPool;

    expect(raw.directQueries, '2 文に分けて pool へ流す').toHaveLength(2);
    expect(raw.directQueries[0]).toContain('CREATE TABLE inline_users');
    expect(raw.driverQueries.join('\n'), 'inline は台帳を作らない').not.toContain('kysely_migration');
  });
});

describe('setupOrmEnv — kysely + live + mysql の folder migration と seed (#2170)', () => {
  it('T-KLF-101 folder の migration を順に適用し、 台帳へ記録する', async () => {
    const folder = await writeMigrationFolder();
    const env = await setupKysely('mysql', { migrations: { folder } });
    stopEnv = env.stop;
    const raw = env.raw as FakeMysqlPool;
    const flowed = raw.driverQueries.join('\n');

    expect(flowed, '台帳表を作る').toContain('kysely_migration');
    // mysql の識別子は backtick。 postgres の二重引用符になっていたら dialect が違う。
    expect(flowed, '1 本目が届く').toContain('create table `folder_users`');
    expect(flowed, '2 本目が届く').toContain('create index `folder_users_email_idx`');
    const recorded = paramsOf(raw.driverCalls, 'insert into `kysely_migration`');
    expect(recorded, '1 本目を適用済として書き込む').toContain('20260101_create_users');
    expect(recorded, '2 本目を適用済として書き込む').toContain('20260102_add_index');
    expect(
      flowed.indexOf('create table `folder_users`'),
      '表を作ってから index を作る',
    ).toBeLessThan(flowed.indexOf('create index `folder_users_email_idx`'));
    expect(raw.directQueries, 'inline SQL 経路は通らない').toHaveLength(0);
    // 使い終わった connection を返さない と pool が枯れる。
    expect(raw.releases, 'connection を返す').toBeGreaterThan(0);
  });

  it('T-KLF-102 seed は組み立て済の Kysely を受け取り、 その書込みが driver へ届く', async () => {
    const seen: unknown[] = [];
    const env = await setupKysely('mysql', {
      seed: async (db: Kysely<Db>) => {
        seen.push(db);
        await db.insertInto('users').values({ id: 1, email: 'a@example.com' }).execute();
      },
    });
    stopEnv = env.stop;
    const raw = env.raw as FakeMysqlPool;

    expect(seen, 'seed は 1 度だけ').toHaveLength(1);
    expect(seen[0], 'seed が受け取るのは db (pool ではない)').toBe(env.db);
    // db を渡すだけで実行できていないと、 driver に何も届かない。
    expect(raw.driverQueries.join('\n'), 'seed の書込みが driver まで届く').toContain('insert into `users`');
    expect(raw.directQueries, 'seed は pool へ直接流さない').toHaveLength(0);
  });

  it('T-KLF-103 seed は migration の後に走る', async () => {
    const folder = await writeMigrationFolder();
    // seed が呼ばれた瞬間に、 migration の DDL が既に driver へ届いているかを問う。
    // 終わった後の状態を見るだけでは、 順序が逆でも同じ結果になる。
    let migrationSeenAtSeed: boolean | null = null;
    const env = await setupKysely('mysql', {
      migrations: { folder },
      seed: async () => {
        const pool = __mysqlPools[0];
        migrationSeenAtSeed = pool !== undefined && pool.driverQueries.some((q) => q.includes('create table `folder_users`'));
      },
    });
    stopEnv = env.stop;

    expect(migrationSeenAtSeed, 'seed の時点で migration は適用済み').toBe(true);
  });
});
