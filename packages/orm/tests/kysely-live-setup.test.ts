/**
 * `setupOrmEnv` の Kysely + live 経路 2 本を覆う検査 (Issue #2161)。
 *
 * この 2 本は coverage 上 **実行回数 0** だった。 6 本ある live driver のうち
 * drizzle 2 本は実 container、prisma postgres 1 本は container を差し替えて
 * 覆われていたが、Kysely の 2 本はどちらの経路も持っていなかった。
 *
 * ## 何を差し替えるか
 *
 * container (`@testcontainers/*`) と driver (`pg` / `mysql2/promise`) だけ。
 * **kysely は実物を使う**。 差し替えると「Kysely を組み立てられたか」 が
 * 自分の fake を見ているだけになり、dialect の受け口が変わっても気付けない。
 *
 * ## なぜ実 Docker を使わないか
 *
 * 同じ経路を実 container でも覆うと、落ちた時に **どちらが壊れたか読み分けられない**。
 * prisma postgres が既に差し替えで覆われているので、そちらに揃える。
 *
 * 実 container の test は image の cache 状態に依存する (#2159 で cold pull 81.5 秒を実測)。
 * 組み立ての検査にその依存を持ち込まない。 既存の drizzle 2 本が保証するのは
 * image / URI / driver の実 DB round-trip までで、Kysely 固有の組み立ては本 file が
 * 実 Kysely の query と driver 形状の fake で検査する。
 */
import type { Kysely } from 'kysely';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** 起動した容器。 停止まで確かめるために残す。 */
interface FakeContainer {
  image: string;
  stopped: boolean;
}
const __containers: FakeContainer[] = [];
/** 起動そのものを失敗させる切替。 Docker が居ない環境の再現に使う。 */
let __startFails = false;

class FakePostgresContainer {
  stopped = false;
  constructor(public readonly image: string) {}
  async start(): Promise<FakePostgresContainer> {
    if (__startFails) throw new Error('Cannot connect to the Docker daemon');
    __containers.push(this);
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
    if (__startFails) throw new Error('Cannot connect to the Docker daemon');
    __containers.push(this);
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

/** `pg` の Pool に渡った設定と、流れた SQL。 */
const __pgPools: FakePgPool[] = [];

class FakePgPool {
  queries: string[] = [];
  driverQueries: string[] = [];
  ended = false;
  endCalls = 0;
  constructor(public readonly config: { connectionString: string; max?: number }) {
    __pgPools.push(this);
  }
  async query(sql: string): Promise<{ rows: never[] }> {
    this.queries.push(sql);
    return { rows: [] };
  }
  async end(): Promise<void> {
    this.endCalls += 1;
    this.ended = true;
  }
  async connect(): Promise<{
    query: (sql: string) => Promise<{ command: string; rowCount: number; rows: never[] }>;
    release: () => void;
  }> {
    return {
      query: async (sql: string) => {
        this.driverQueries.push(sql);
        return { command: 'SELECT', rowCount: 0, rows: [] };
      },
      release: () => undefined,
    };
  }
}

/**
 * `pg` が `Pool` をどこに置くかは build により違う。 実装は
 * `default?.Pool ?? Pool` の順で解決するので、**fallback 側 (named export だけ)** の
 * 形も作れるようにする。
 *
 * key は常に生やして値を `undefined` にする。 key ごと消すと vitest が
 * 「その export は mock に無い」 と throw し、実装の分岐まで届かない。
 */
let __pgExportShape: 'both' | 'named-only' = 'both';
vi.mock('pg', () => ({
  get Pool() {
    return FakePgPool;
  },
  get default() {
    return __pgExportShape === 'both' ? { Pool: FakePgPool } : undefined;
  },
}));

const __mysqlPools: FakeMysqlPool[] = [];

class FakeMysqlPool {
  queries: string[] = [];
  driverQueries: string[] = [];
  ended = false;
  endCalls = 0;
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
        query: (sql, _params, done) => {
          this.driverQueries.push(sql);
          done(null, []);
        },
        release: () => undefined,
      });
    },
  };
  constructor(public readonly uri: string) {
    __mysqlPools.push(this);
  }
  async query(sql: string): Promise<[never[], never[]]> {
    this.queries.push(sql);
    return [[], []];
  }
  async end(): Promise<void> {
    this.endCalls += 1;
    this.ended = true;
  }
}

/**
 * `mysql2/promise` の `createPool` も 2 形ある。 戻り値は promise facade だが、
 * Kysely が要求する callback pool はその `.pool` にある。 実装は
 * `createPool ?? default.createPool` の順なので、**fallback 側 (default だけ)** と
 * **どちらにも無い形** を作れるようにする。
 */
let __mysql2ExportShape: 'named' | 'default-only' | 'missing' = 'named';
const __makeMysqlPool = (uri: string): FakeMysqlPool => new FakeMysqlPool(uri);
vi.mock('mysql2/promise', () => ({
  get createPool() {
    return __mysql2ExportShape === 'named' ? __makeMysqlPool : undefined;
  },
  get default() {
    return __mysql2ExportShape === 'default-only' ? { createPool: __makeMysqlPool } : {};
  },
}));

const { setupOrmEnv } = await import('../src/index.js');

interface Db {
  users: { id: number; email: string };
}

/** この経路が返す形。 `setupOrmEnv` の戻り値は union なので呼出側で絞る。 */
interface KyselyLiveEnv {
  mode: string;
  orm: string;
  dialect: string;
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

beforeEach(() => {
  __containers.length = 0;
  __pgPools.length = 0;
  __mysqlPools.length = 0;
  __startFails = false;
  __pgExportShape = 'both';
  __mysql2ExportShape = 'named';
});

describe('setupOrmEnv — kysely + live + postgres (#2161)', () => {
  it('T-KLS-001 容器を起こし、その接続先で pool と Kysely を組み立てる', async () => {
    const env = await setupKysely('postgres');

    expect(env.mode).toBe('live');
    expect(env.orm).toBe('kysely');
    expect(env.dialect).toBe('postgres');
    expect(env.connectionUri).toBe('postgres://user:pass@127.0.0.1:55432/test');
    expect(__containers).toHaveLength(1);
    expect(__containers[0]?.image, '既定の image').toBe('postgres:16-alpine');
    // 接続先が pool へ渡っていないと、容器を起こした意味が無い。
    expect(__pgPools[0]?.config.connectionString).toBe(env.connectionUri);
    expect(__pgPools[0]?.config.max).toBe(4);
    // query を実行して、遅延初期化される実 Kysely driver と pool の受け口まで通す。
    await env.db.selectFrom('users').select('id').execute();
    expect(__pgPools[0]?.driverQueries[0]).toContain('select "id" from "users"');

    await env.stop();
  });

  it('T-KLS-002 image を指定できる', async () => {
    const env = await setupKysely('postgres', { containerImage: 'postgres:15-alpine' });
    expect(__containers[0]?.image).toBe('postgres:15-alpine');
    await env.stop();
  });

  it('T-KLS-003 inline SQL の migration を 1 文ずつ pool へ流す', async () => {
    const env = await setupKysely('postgres', {
      migrations: 'CREATE TABLE users (id SERIAL);\nCREATE INDEX users_id_idx ON users(id);',
    });
    // 分割せずに 1 文として流すと、2 文目が黙って捨てられる。
    expect(__pgPools[0]?.queries).toHaveLength(2);
    expect(__pgPools[0]?.queries[0]).toContain('CREATE TABLE users');
    expect(__pgPools[0]?.queries[1]).toContain('CREATE INDEX users_id_idx');
    await env.stop();
  });

  it('T-KLS-004 seed に組み立てた Kysely を渡す', async () => {
    const seen: unknown[] = [];
    const env = await setupKysely('postgres', {
      seed: async (db: unknown) => {
        seen.push(db);
      },
    });
    expect(seen, 'seed が 1 度呼ばれる').toHaveLength(1);
    expect(seen[0], 'seed が受け取るのは db (pool ではない)').toBe(env.db);
    await env.stop();
  });

  it('T-KLS-005 pg が Pool を named export にしか置かない形でも解決する', async () => {
    // 実装は `default?.Pool ?? Pool` の順。 default を持たない build がこの枝に入る。
    __pgExportShape = 'named-only';
    // 前提を先に固定する。 差し替えが効いていないと、この検査は既定の枝を通って
    // 素通りする (「fallback を消しても落ちない」 形になる)。
    const mod = (await import('pg')) as unknown as Record<string, unknown>;
    expect(mod['default'], 'default を持たない形になっている').toBeUndefined();
    expect(typeof mod['Pool'], 'named export だけが残る').toBe('function');

    const env = await setupKysely('postgres');
    expect(__pgPools, 'pool を 1 本作る').toHaveLength(1);
    expect(__pgPools[0]?.config.connectionString).toBe(env.connectionUri);
    await env.stop();
  });

  it('T-KLS-006 容器の起動に失敗したら image を名指しして知らせる', async () => {
    __startFails = true;
    await expect(setupKysely('postgres')).rejects.toThrow(/postgres:16-alpine/);
    // 起動できていないので後始末する容器も無い。
    expect(__containers).toHaveLength(0);
  });

  it('T-KLS-007 stop で pool を閉じ、容器も止める', async () => {
    const env = await setupKysely('postgres');
    const pool = __pgPools[0]!;
    const container = __containers[0]!;
    await env.db.selectFrom('users').select('id').execute();
    expect(pool.ended).toBe(false);
    expect(container.stopped).toBe(false);

    await env.stop();

    expect(pool.ended, 'pool を閉じない と接続が残る').toBe(true);
    expect(pool.endCalls, 'Kysely と stop から二重に閉じない').toBe(1);
    expect(container.stopped, '容器を止めない と Docker に残る').toBe(true);
  });
});

describe('setupOrmEnv — kysely + live + mysql (#2161)', () => {
  it('T-KLS-101 容器を起こし、その接続先で pool と Kysely を組み立てる', async () => {
    const env = await setupKysely('mysql');

    expect(env.mode).toBe('live');
    expect(env.orm).toBe('kysely');
    expect(env.dialect).toBe('mysql');
    expect(env.connectionUri).toBe('mysql://user:pass@127.0.0.1:33306/test');
    expect(__containers[0]?.image, '既定の image').toBe('mysql:8.4');
    // mysql2 の createPool は URI を 1 本で受ける (pg の config object と違う)。
    expect(__mysqlPools[0]?.uri).toBe(env.connectionUri);
    // PromisePool 自体ではなく callback pool が Kysely へ渡ることまで検査する。
    await env.db.selectFrom('users').select('id').execute();
    expect(__mysqlPools[0]?.driverQueries[0]).toContain('select `id` from `users`');

    await env.stop();
  });

  it('T-KLS-102 image を指定できる', async () => {
    const env = await setupKysely('mysql', { containerImage: 'mysql:8.0' });
    expect(__containers[0]?.image).toBe('mysql:8.0');
    await env.stop();
  });

  it('T-KLS-103 inline SQL の migration を 1 文ずつ pool へ流す', async () => {
    const env = await setupKysely('mysql', {
      migrations: 'CREATE TABLE users (id INT);\nCREATE INDEX users_id_idx ON users(id);',
    });
    expect(__mysqlPools[0]?.queries).toHaveLength(2);
    await env.stop();
  });

  it('T-KLS-104 mysql2 が createPool を default にしか置かない形でも解決する', async () => {
    __mysql2ExportShape = 'default-only';
    // 前提を先に固定する。 差し替えが効いていないと、この検査は既定の枝を通って
    // 素通りする (「fallback を消しても落ちない」 形になる)。
    const mod = (await import('mysql2/promise')) as unknown as Record<string, unknown>;
    expect(mod['createPool'], 'named export は無い形になっている').toBeUndefined();
    expect(
      typeof (mod['default'] as { createPool?: unknown } | undefined)?.createPool,
      'default だけが createPool を持つ',
    ).toBe('function');

    const env = await setupKysely('mysql');
    expect(__mysqlPools, 'pool を 1 本作る').toHaveLength(1);
    expect(__mysqlPools[0]?.uri).toBe(env.connectionUri);
    await env.stop();
  });

  it('T-KLS-105 createPool を解決できない形は、その旨を名指しして止まる', async () => {
    __mysql2ExportShape = 'missing';
    await expect(setupKysely('mysql')).rejects.toThrow(/createPool/);
    expect(__containers, 'error 前に容器は起動済み').toHaveLength(1);
    expect(__containers[0]?.stopped, '途中失敗でも容器を残さない').toBe(true);
  });

  it('T-KLS-106 容器の起動に失敗したら image を名指しして知らせる', async () => {
    __startFails = true;
    await expect(setupKysely('mysql')).rejects.toThrow(/mysql:8\.4/);
    expect(__containers).toHaveLength(0);
  });

  it('T-KLS-107 stop で pool を閉じ、容器も止める', async () => {
    const env = await setupKysely('mysql');
    const pool = __mysqlPools[0]!;
    const container = __containers[0]!;
    await env.db.selectFrom('users').select('id').execute();

    await env.stop();

    expect(pool.ended).toBe(true);
    expect(pool.endCalls, 'Kysely と stop から二重に閉じない').toBe(1);
    expect(container.stopped).toBe(true);
  });
});
