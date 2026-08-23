/**
 * `setupOrmEnv` の drizzle + live 2 本のうち、 実 container では通らない枝の検査 (Issue #2170)。
 *
 * 実 Docker を使う `live-mode.test.ts` / `live-mysql.test.ts` は「起きた後」 しか通れない。
 * 起動に失敗した時の案内文と、 `migrations: { folder }` を渡した時の migrator 経路は
 * coverage 上 **実行回数 0** のまま残っていた。
 *
 * ## 何を差し替えるか
 *
 * container (`@testcontainers/*`) と driver (`postgres` / `mysql2/promise`) だけ。
 * **drizzle は実物を使う**。 差し替えると「migrator が folder を読んで DDL を driver へ
 * 流したか」 が自分の fake を見ているだけになり、 folder 経路と inline SQL 経路を
 * 取り違えても気付けない。
 *
 * ## なぜ実 Docker を使わないか
 *
 * 起動失敗の枝は、 実 Docker が居る環境では原理的に通れない。 image の cache 状態にも
 * 依存する (#2159 で cold pull 81.5 秒を実測)。 実 DB の往復は既存 2 file が担う。
 */
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

/** 起動と停止の順序を、 起きた瞬間の相手の状態ごと残す。 */
interface Moment {
  readonly event: 'raw.end' | 'container.stop';
  /** その瞬間に driver が閉じ終わっていたか。 */
  readonly rawEnded: boolean;
  /** その瞬間に container が止まっていたか。 */
  readonly containerStopped: boolean;
}
const __moments: Moment[] = [];

/** 起動そのものを失敗させる切替。 Docker が居ない環境の再現に使う。 */
let __startFails = false;
const START_FAILURE = 'Cannot connect to the Docker daemon at unix:///var/run/docker.sock';

/** いま組み立て中の driver。 停止の瞬間に状態を問うために覗く。 */
let __currentRaw: { ended: boolean } | null = null;
let __currentContainer: { stopped: boolean } | null = null;

class FakePostgresContainer {
  stopped = false;
  constructor(public readonly image: string) {}
  async start(): Promise<FakePostgresContainer> {
    if (__startFails) throw new Error(START_FAILURE);
    __currentContainer = this;
    return this;
  }
  getConnectionUri(): string {
    return 'postgres://user:pass@127.0.0.1:55432/test';
  }
  async stop(): Promise<void> {
    __moments.push({
      event: 'container.stop',
      rawEnded: __currentRaw?.ended ?? false,
      containerStopped: this.stopped,
    });
    this.stopped = true;
  }
}

class FakeMySqlContainer {
  stopped = false;
  constructor(public readonly image: string) {}
  async start(): Promise<FakeMySqlContainer> {
    if (__startFails) throw new Error(START_FAILURE);
    __currentContainer = this;
    return this;
  }
  getConnectionUri(): string {
    return 'mysql://user:pass@127.0.0.1:33306/test';
  }
  async stop(): Promise<void> {
    __moments.push({
      event: 'container.stop',
      rawEnded: __currentRaw?.ended ?? false,
      containerStopped: this.stopped,
    });
    this.stopped = true;
  }
}

vi.mock('@testcontainers/postgresql', () => ({ PostgreSqlContainer: FakePostgresContainer }));
vi.mock('@testcontainers/mysql', () => ({ MySqlContainer: FakeMySqlContainer }));

/** `postgres` の factory に渡った設定と、 driver へ流れた SQL。 */
interface PostgresFactoryCall {
  url: string;
  opts: { max: number; onnotice?: () => void };
}
const __postgresCalls: PostgresFactoryCall[] = [];

class FakePostgresSql {
  /** driver へ届いた SQL。 migrator の DDL も inline SQL もここに並ぶ。 */
  readonly statements: string[] = [];
  /** `begin` で開いた回数。 migrator は transaction を 1 つ開く。 */
  transactions = 0;
  ended = false;
  endOptions: { timeout?: number } | null = null;
  /** drizzle の driver が起動時に書き換える。 実物と同じく持っておく。 */
  readonly options = { parsers: {} as Record<string, unknown>, serializers: {} as Record<string, unknown> };

  unsafe(query: string, params?: readonly unknown[]): Promise<never[]> {
    this.statements.push(query);
    void params;
    const result = Promise.resolve([] as never[]) as Promise<never[]> & { values: () => Promise<never[]> };
    result.values = (): Promise<never[]> => Promise.resolve([] as never[]);
    return result;
  }

  async begin<T>(callback: (tx: FakePostgresSql) => Promise<T>): Promise<T> {
    this.transactions += 1;
    return callback(this);
  }

  async end(opts?: { timeout?: number }): Promise<void> {
    this.endOptions = opts ?? null;
    __moments.push({
      event: 'raw.end',
      rawEnded: this.ended,
      containerStopped: __currentContainer?.stopped ?? false,
    });
    this.ended = true;
  }
}

/**
 * postgres.js の既定 export は factory 関数そのもの。 実装は `default` が関数なら
 * それを、 そうでなければ名前空間自体を factory として扱うため、 実物と同じ形に置く。
 */
vi.mock('postgres', () => ({
  default: (url: string, opts: { max: number; onnotice?: () => void }): FakePostgresSql => {
    __postgresCalls.push({ url, opts });
    const sql = new FakePostgresSql();
    __currentRaw = sql;
    return sql;
  },
}));

/** mysql2 の connection。 `getConnection` を持たないことで pool と区別される。 */
class FakeMysqlConnection {
  released = 0;
  constructor(private readonly pool: FakeMysqlPool) {}
  async query(query: string | { sql: string }, params?: readonly unknown[]): Promise<[{ insertId: number; affectedRows: number }, never[]]> {
    this.pool.statements.push(typeof query === 'string' ? query : query.sql);
    void params;
    return [{ insertId: 0, affectedRows: 0 }, []];
  }
  async execute(query: string, params?: readonly unknown[]): Promise<[never[], never[]]> {
    this.pool.statements.push(query);
    void params;
    return [[] as never[], [] as never[]];
  }
  release(): void {
    this.released += 1;
  }
}

class FakeMysqlPool {
  /** driver へ届いた SQL。 migrator の DDL も inline SQL もここに並ぶ。 */
  readonly statements: string[] = [];
  readonly connections: FakeMysqlConnection[] = [];
  ended = false;
  constructor(public readonly uri: string) {}

  async query(query: string | { sql: string }, params?: readonly unknown[]): Promise<[{ insertId: number; affectedRows: number }, never[]]> {
    this.statements.push(typeof query === 'string' ? query : query.sql);
    void params;
    return [{ insertId: 0, affectedRows: 0 }, []];
  }

  async execute(query: string, params?: readonly unknown[]): Promise<[never[], never[]]> {
    this.statements.push(query);
    void params;
    return [[] as never[], [] as never[]];
  }

  async getConnection(): Promise<FakeMysqlConnection> {
    const conn = new FakeMysqlConnection(this);
    this.connections.push(conn);
    return conn;
  }

  async end(): Promise<void> {
    __moments.push({
      event: 'raw.end',
      rawEnded: this.ended,
      containerStopped: __currentContainer?.stopped ?? false,
    });
    this.ended = true;
  }
}

const __mysqlPools: FakeMysqlPool[] = [];
const __createPool = (uri: string): FakeMysqlPool => {
  const pool = new FakeMysqlPool(uri);
  __mysqlPools.push(pool);
  __currentRaw = pool;
  return pool;
};
/**
 * `mysql2/promise` は名前付き export と `default` の両方から `createPool` を出す。
 * 実装は名前付きを先に見るが、 `default` を読む行も通るため両方置く
 * (片方を消すと vitest がその export を持たない mock として throw する)。
 */
vi.mock('mysql2/promise', () => ({
  createPool: __createPool,
  default: { createPool: __createPool },
}));

const { setupOrmEnv } = await import('../src/index.js');

/** 実装は overload で組合せを絞るため、 検査側は union を外して渡す。 */
interface DrizzleLiveEnv {
  connectionUri: string;
  raw: FakePostgresSql | FakeMysqlPool;
  db: unknown;
  stop: () => Promise<void>;
}
async function setupDrizzleLive(
  dialect: 'postgres' | 'mysql',
  overrides: Record<string, unknown> = {},
): Promise<DrizzleLiveEnv> {
  const env = await setupOrmEnv({
    mode: 'live',
    orm: 'drizzle',
    dialect,
    schema: {},
    ...overrides,
  } as unknown as Parameters<typeof setupOrmEnv>[0]);
  return env as unknown as DrizzleLiveEnv;
}

let tmp: string | null = null;

/**
 * drizzle-kit が出力する形の folder を書く。
 *
 * migrator は `meta/_journal.json` を読み、 各 entry の `tag` から `<tag>.sql` を探す。
 * file 内は `--> statement-breakpoint` で区切る (`;` ではない)。 inline SQL 経路と
 * 区別できるよう 2 文入れて、 両方が driver へ届くことを見る。
 */
async function writeMigrationFolder(dialect: 'postgres' | 'mysql'): Promise<string> {
  tmp = await mkdtemp(join(tmpdir(), `kiwa-drizzle-live-${dialect}-`));
  await mkdir(join(tmp, 'meta'), { recursive: true });
  await writeFile(
    join(tmp, 'meta', '_journal.json'),
    JSON.stringify({
      version: '7',
      dialect,
      entries: [{ idx: 0, version: '7', when: 1_735_689_600_000, tag: '0000_create_users', breakpoints: true }],
    }),
  );
  await writeFile(
    join(tmp, '0000_create_users.sql'),
    [
      'CREATE TABLE folder_users (id INTEGER NOT NULL);',
      '--> statement-breakpoint',
      'CREATE INDEX folder_users_id_idx ON folder_users (id);',
    ].join('\n'),
  );
  return tmp;
}

beforeEach(() => {
  __moments.length = 0;
  __postgresCalls.length = 0;
  __mysqlPools.length = 0;
  __startFails = false;
  __currentRaw = null;
  __currentContainer = null;
});

afterEach(async () => {
  if (tmp !== null) {
    await rm(tmp, { recursive: true, force: true });
    tmp = null;
  }
});

describe('setupOrmEnv — drizzle + live + postgres の container 起動失敗 (#2170)', () => {
  it('T-DLS-001 image と docker ps の確認を案内し、 元の理由も添える', async () => {
    __startFails = true;

    const message = await setupDrizzleLive('postgres').then(
      () => '',
      (caught: unknown) => String((caught as Error).message),
    );

    expect(message, '起動に失敗したら投げる').not.toBe('');
    expect(message).toContain('failed to start Postgres testcontainer');
    // どの image で失敗したかが無いと、 pull 待ちなのか image 名の誤りなのか読めない。
    expect(message, '既定の image を名指しする').toContain('image=postgres:16-alpine');
    // 次に何をすればよいかを 1 つだけ示す。
    expect(message).toContain('Verify the Docker daemon is running');
    expect(message).toContain('`docker ps` should succeed');
    expect(message, '元の理由を落とさない').toContain(START_FAILURE);
    // 起動できていないので driver も作らない。
    expect(__postgresCalls, 'driver を作らない').toHaveLength(0);
  });

  it('T-DLS-002 指定した image で失敗したら、 その image を名指しする', async () => {
    __startFails = true;
    const message = await setupDrizzleLive('postgres', { containerImage: 'postgres:15-alpine' }).then(
      () => '',
      (caught: unknown) => String((caught as Error).message),
    );
    expect(message, '既定ではなく指定値を返す').toContain('image=postgres:15-alpine');
    expect(message).not.toContain('postgres:16-alpine');
  });
});

describe('setupOrmEnv — drizzle + live + mysql の container 起動失敗 (#2170)', () => {
  it('T-DLS-101 mysql の image と docker ps の確認を案内する', async () => {
    __startFails = true;

    const message = await setupDrizzleLive('mysql').then(
      () => '',
      (caught: unknown) => String((caught as Error).message),
    );

    expect(message).toContain('failed to start MySQL testcontainer');
    expect(message, '既定の image を名指しする').toContain('image=mysql:8.4');
    expect(message).toContain('`docker ps` should succeed');
    expect(message).toContain(START_FAILURE);
    // postgres 側の案内に化けていないことを見る。
    expect(message).not.toContain('Postgres testcontainer');
    expect(__mysqlPools, 'driver を作らない').toHaveLength(0);
  });

  it('T-DLS-102 指定した image で失敗したら、 その image を名指しする', async () => {
    __startFails = true;
    const message = await setupDrizzleLive('mysql', { containerImage: 'mysql:8.0' }).then(
      () => '',
      (caught: unknown) => String((caught as Error).message),
    );
    expect(message).toContain('image=mysql:8.0');
    expect(message).not.toContain('mysql:8.4');
  });
});

describe('setupOrmEnv — drizzle + live + postgres の driver 組み立て (#2170)', () => {
  it('T-DLS-201 接続先と上限を driver へ渡し、 通知を捨てる handler を付ける', async () => {
    const env = await setupDrizzleLive('postgres');

    expect(__postgresCalls, 'driver を 1 本作る').toHaveLength(1);
    expect(__postgresCalls[0]?.url, '容器の接続先を渡す').toBe(env.connectionUri);
    expect(__postgresCalls[0]?.opts.max, '接続上限を渡す').toBe(4);
    // handler を渡さないと postgres.js は NOTICE を stdout へ出す。
    // 「捨てる」 のが仕様なので、 呼んでも何も返さず投げないことまで見る。
    const onnotice = __postgresCalls[0]?.opts.onnotice;
    expect(typeof onnotice, '通知の受け口を渡す').toBe('function');
    expect(onnotice?.(), '通知は捨てる').toBeUndefined();

    await env.stop();
  });

  it('T-DLS-202 inline SQL は 1 文ずつ driver へ流し、 台帳は作らない', async () => {
    const env = await setupDrizzleLive('postgres', {
      migrations: 'CREATE TABLE users (id SERIAL);\nCREATE INDEX users_id_idx ON users(id);',
    });
    const raw = env.raw as FakePostgresSql;

    expect(raw.statements, '2 文に分けて流す').toHaveLength(2);
    expect(raw.statements[0]).toContain('CREATE TABLE users');
    expect(raw.statements[1]).toContain('CREATE INDEX users_id_idx');
    // 台帳は folder 経路だけが作る。 inline なのに作っていたら経路を取り違えている。
    expect(raw.statements.join('\n')).not.toContain('__drizzle_migrations');
    expect(raw.transactions, 'inline は transaction を開かない').toBe(0);

    await env.stop();
  });

  it('T-DLS-203 folder を渡すと migrator が台帳を作り、 file の 2 文を transaction で流す', async () => {
    const folder = await writeMigrationFolder('postgres');
    const env = await setupDrizzleLive('postgres', { migrations: { folder } });
    const raw = env.raw as FakePostgresSql;
    const flowed = raw.statements.join('\n');

    // 台帳の作成は folder 経路の目印。 inline 経路には無い。
    expect(flowed, 'schema を先に作る').toContain('CREATE SCHEMA IF NOT EXISTS "drizzle"');
    expect(flowed, '台帳表を作る').toContain('"drizzle"."__drizzle_migrations"');
    // file の中身が届いていないと、 folder を読めていない。
    expect(flowed, '1 文目が届く').toContain('CREATE TABLE folder_users');
    expect(flowed, '`--> statement-breakpoint` の後ろも届く').toContain('CREATE INDEX folder_users_id_idx');
    // 適用済の記録を残さないと、 次回に同じ migration を再適用する。
    expect(flowed).toContain('insert into "drizzle"."__drizzle_migrations"');
    expect(raw.transactions, '適用は transaction の中で行う').toBe(1);

    await env.stop();
  });

  it('T-DLS-204 stop は driver を閉じてから容器を止める', async () => {
    const env = await setupDrizzleLive('postgres');
    const raw = env.raw as FakePostgresSql;

    await env.stop();

    expect(raw.ended, 'driver を閉じない と接続が残る').toBe(true);
    expect(raw.endOptions?.timeout, '閉じ待ちの上限を渡す').toBe(5);
    // 終わった後の 2 状態を見るだけでは逆順でも通る。 起きた瞬間の相手の状態を見る。
    const stopMoment = __moments.find((m) => m.event === 'container.stop');
    const endMoment = __moments.find((m) => m.event === 'raw.end');
    expect(endMoment?.containerStopped, 'driver を閉じる時点で容器はまだ動いている').toBe(false);
    expect(stopMoment?.rawEnded, '容器を止める時点で driver は閉じ終わっている').toBe(true);
  });
});

describe('setupOrmEnv — drizzle + live + mysql の driver 組み立て (#2170)', () => {
  it('T-DLS-301 接続先を 1 本の URI で driver へ渡す', async () => {
    const env = await setupDrizzleLive('mysql');

    expect(__mysqlPools, 'pool を 1 本作る').toHaveLength(1);
    // mysql2 の createPool は URI を 1 本で受ける (postgres の設定 object と違う)。
    expect(__mysqlPools[0]?.uri).toBe(env.connectionUri);

    await env.stop();
  });

  it('T-DLS-302 inline SQL は 1 文ずつ pool へ流し、 台帳は作らない', async () => {
    const env = await setupDrizzleLive('mysql', {
      migrations: 'CREATE TABLE users (id INT);\nCREATE INDEX users_id_idx ON users(id);',
    });
    const raw = env.raw as FakeMysqlPool;

    expect(raw.statements, '2 文に分けて流す').toHaveLength(2);
    expect(raw.statements[0]).toContain('CREATE TABLE users');
    expect(raw.statements[1]).toContain('CREATE INDEX users_id_idx');
    expect(raw.statements.join('\n')).not.toContain('__drizzle_migrations');
    expect(raw.connections, 'inline は connection を取り出さない').toHaveLength(0);

    await env.stop();
  });

  it('T-DLS-303 folder を渡すと migrator が台帳を作り、 file の 2 文を connection で流す', async () => {
    const folder = await writeMigrationFolder('mysql');
    const env = await setupDrizzleLive('mysql', { migrations: { folder } });
    const raw = env.raw as FakeMysqlPool;
    const flowed = raw.statements.join('\n');

    expect(flowed, '台帳表を作る').toContain('`__drizzle_migrations`');
    expect(flowed, '1 文目が届く').toContain('CREATE TABLE folder_users');
    expect(flowed, '`--> statement-breakpoint` の後ろも届く').toContain('CREATE INDEX folder_users_id_idx');
    expect(flowed, '適用済を記録する').toContain('insert into `__drizzle_migrations`');
    // mysql は transaction を pool から取り出した connection の上で開く。
    expect(raw.connections, 'transaction 用に connection を 1 本取る').toHaveLength(1);
    expect(flowed).toContain('begin');
    expect(flowed).toContain('commit');
    expect(raw.connections[0]?.released, '使い終わった connection を返す').toBe(1);

    await env.stop();
  });

  it('T-DLS-304 stop は pool を閉じてから容器を止める', async () => {
    const env = await setupDrizzleLive('mysql');
    const raw = env.raw as FakeMysqlPool;

    await env.stop();

    expect(raw.ended, 'pool を閉じない と接続が残る').toBe(true);
    const stopMoment = __moments.find((m) => m.event === 'container.stop');
    const endMoment = __moments.find((m) => m.event === 'raw.end');
    expect(endMoment?.containerStopped, 'pool を閉じる時点で容器はまだ動いている').toBe(false);
    expect(stopMoment?.rawEnded, '容器を止める時点で pool は閉じ終わっている').toBe(true);
  });
});
