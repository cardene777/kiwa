/**
 * `setupOrmEnv` の live 6 経路で、 container を起こした後に投げた時の片付けの検査 (Issue #2173)。
 *
 * live setup は container を起こしてから driver を組み立て、 migration を当て、 seed を回す。
 * この途中で投げると `stop` を返す前に reject するため、 変更前は driver も container も
 * 残っていた。 残った container は `docker ps` に溜まり、 port も掴んだままになる。
 *
 * ## 何を差し替えるか
 *
 * container (`@testcontainers/*`)、 driver (`postgres` / `mysql2/promise` / `pg`)、
 * prisma の client と `db push` の起動 (`node:child_process`) だけ。 drizzle と kysely は
 * 実物を使う。 差し替えると migration を当てた経路まで自分の fake を見ることになる。
 *
 * ## なぜ実 container を起こさないか
 *
 * ここで見たいのは「失敗した後に片付けたか」 で、 失敗は利用者側の誤り (壊れた migration /
 * 投げる seed) で起きる。 実 container を起こしても再現できるが、 起動に数秒かかるうえ
 * 片付けに失敗した検査自体が container を残す。 差し替えなら失敗を直接作れる。
 *
 * ## 順序の見方
 *
 * 終わった後に 2 つの状態を見るだけでは、 逆順で片付けても同じ結果になる。 片方が起きた
 * 瞬間にもう片方の状態を問う (`Moment`)。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** 片付けが起きた瞬間に、 相手がどうなっていたかを一緒に残す。 */
interface Moment {
  readonly event: 'driver.close' | 'container.stop';
  /** その瞬間に driver が閉じ終わっていたか。 */
  readonly driverClosed: boolean;
  /** その瞬間に container が止まっていたか。 */
  readonly containerStopped: boolean;
}
const __moments: Moment[] = [];

/** いま組み立て中の driver と container。 瞬間ごとに相手の状態を問うために覗く。 */
let __currentDriver: { closed: boolean } | null = null;
let __currentContainer: { stopped: boolean } | null = null;

function recordDriverClose(driver: { closed: boolean }): void {
  __moments.push({
    event: 'driver.close',
    driverClosed: driver.closed,
    containerStopped: __currentContainer?.stopped ?? false,
  });
}

function recordContainerStop(container: { stopped: boolean }): void {
  __moments.push({
    event: 'container.stop',
    driverClosed: __currentDriver?.closed ?? false,
    containerStopped: container.stopped,
  });
}

/** container の起動そのものを失敗させる切替。 Docker が居ない形の再現に使う。 */
let __startFails = false;
const START_FAILURE = 'Cannot connect to the Docker daemon at unix:///var/run/docker.sock';

/** driver factory を失敗させる切替。 */
let __driverFactoryFails = false;
const FACTORY_FAILURE = 'driver factory exploded';

/** この文字列を含む SQL が driver へ届いた時に投げる。 inline SQL の失敗に使う。 */
let __failingStatement: string | null = null;
const STATEMENT_FAILURE = 'inline DDL exploded';

const SEED_FAILURE = 'seed exploded';
const SPAWN_FAILURE = 'spawn pnpm ENOENT';
/** 実在しない migration folder。 migrator は読み出しで投げる。 */
const MISSING_FOLDER = '/nonexistent/kiwa-orm-2173-migrations';

function failIfMatches(sql: string): void {
  if (__failingStatement !== null && sql.includes(__failingStatement)) {
    throw new Error(STATEMENT_FAILURE);
  }
}

/** 起こした container。 停止の回数まで見るために残す。 */
interface StartedContainer {
  readonly image: string;
  stopped: boolean;
  stops: number;
}
const __containers: StartedContainer[] = [];

class FakePostgresContainer implements StartedContainer {
  stopped = false;
  stops = 0;
  constructor(public readonly image: string) {}
  async start(): Promise<FakePostgresContainer> {
    if (__startFails) throw new Error(START_FAILURE);
    __containers.push(this);
    __currentContainer = this;
    return this;
  }
  getConnectionUri(): string {
    return 'postgres://user:pass@127.0.0.1:55432/test';
  }
  async stop(): Promise<void> {
    recordContainerStop(this);
    this.stopped = true;
    this.stops += 1;
  }
}

class FakeMySqlContainer implements StartedContainer {
  stopped = false;
  stops = 0;
  constructor(public readonly image: string) {}
  async start(): Promise<FakeMySqlContainer> {
    if (__startFails) throw new Error(START_FAILURE);
    __containers.push(this);
    __currentContainer = this;
    return this;
  }
  getConnectionUri(): string {
    return 'mysql://user:pass@127.0.0.1:33306/test';
  }
  async stop(): Promise<void> {
    recordContainerStop(this);
    this.stopped = true;
    this.stops += 1;
  }
}

vi.mock('@testcontainers/postgresql', () => ({ PostgreSqlContainer: FakePostgresContainer }));
vi.mock('@testcontainers/mysql', () => ({ MySqlContainer: FakeMySqlContainer }));

/** 作られた driver。 1 本も作られなかったことを見るために数える。 */
interface ClosableDriver {
  closed: boolean;
  closes: number;
}
const __drivers: ClosableDriver[] = [];

class FakePostgresSql implements ClosableDriver {
  readonly statements: string[] = [];
  closed = false;
  closes = 0;
  /** drizzle の driver が起動時に書き換える。 実物と同じく持っておく。 */
  readonly options = { parsers: {} as Record<string, unknown>, serializers: {} as Record<string, unknown> };

  unsafe(query: string, params?: readonly unknown[]): Promise<never[]> {
    this.statements.push(query);
    void params;
    failIfMatches(query);
    const result = Promise.resolve([] as never[]) as Promise<never[]> & { values: () => Promise<never[]> };
    result.values = (): Promise<never[]> => Promise.resolve([] as never[]);
    return result;
  }

  async begin<T>(callback: (tx: FakePostgresSql) => Promise<T>): Promise<T> {
    return callback(this);
  }

  async end(opts?: { timeout?: number }): Promise<void> {
    void opts;
    recordDriverClose(this);
    this.closed = true;
    this.closes += 1;
  }
}

vi.mock('postgres', () => ({
  default: (url: string, opts: { max: number; onnotice?: () => void }): FakePostgresSql => {
    void url;
    void opts;
    if (__driverFactoryFails) throw new Error(FACTORY_FAILURE);
    const sql = new FakePostgresSql();
    __drivers.push(sql);
    __currentDriver = sql;
    return sql;
  },
}));

/** mysql2 の connection。 drizzle の migrator が pool から取り出す。 */
class FakeMysqlConnection {
  constructor(private readonly pool: FakeMysqlPool) {}
  async query(query: string | { sql: string }): Promise<[{ insertId: number; affectedRows: number }, never[]]> {
    const sql = typeof query === 'string' ? query : query.sql;
    this.pool.statements.push(sql);
    failIfMatches(sql);
    return [{ insertId: 0, affectedRows: 0 }, []];
  }
  async execute(query: string): Promise<[never[], never[]]> {
    this.pool.statements.push(query);
    failIfMatches(query);
    return [[] as never[], [] as never[]];
  }
  release(): void {
    this.pool.releases += 1;
  }
}

/**
 * `mysql2/promise` の pool。 drizzle は promise 版を直接使い、 kysely は `.pool` の
 * callback 版を使うため、 1 つの fake に両方を持たせる。
 */
class FakeMysqlPool implements ClosableDriver {
  readonly statements: string[] = [];
  closed = false;
  closes = 0;
  releases = 0;
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
          void params;
          this.statements.push(sql);
          try {
            failIfMatches(sql);
          } catch (caught) {
            done(caught instanceof Error ? caught : new Error(String(caught)), []);
            return;
          }
          done(null, []);
        },
        release: () => {
          this.releases += 1;
        },
      });
    },
  };
  constructor(public readonly uri: string) {}

  async query(query: string | { sql: string }): Promise<[{ insertId: number; affectedRows: number }, never[]]> {
    const sql = typeof query === 'string' ? query : query.sql;
    this.statements.push(sql);
    failIfMatches(sql);
    return [{ insertId: 0, affectedRows: 0 }, []];
  }

  async execute(query: string): Promise<[never[], never[]]> {
    this.statements.push(query);
    failIfMatches(query);
    return [[] as never[], [] as never[]];
  }

  async getConnection(): Promise<FakeMysqlConnection> {
    return new FakeMysqlConnection(this);
  }

  async end(): Promise<void> {
    recordDriverClose(this);
    this.closed = true;
    this.closes += 1;
  }
}

const __createPool = (uri: string): FakeMysqlPool => {
  if (__driverFactoryFails) throw new Error(FACTORY_FAILURE);
  const pool = new FakeMysqlPool(uri);
  __drivers.push(pool);
  __currentDriver = pool;
  return pool;
};
/**
 * `mysql2/promise` は名前付き export と `default` の両方から `createPool` を出す。
 * 実装は名前付きを先に見るが、 `default` を読む行も通るため両方置く。
 */
vi.mock('mysql2/promise', () => ({ createPool: __createPool, default: { createPool: __createPool } }));

class FakePgPool implements ClosableDriver {
  readonly statements: string[] = [];
  closed = false;
  closes = 0;
  constructor(public readonly config: { connectionString: string; max?: number }) {
    if (__driverFactoryFails) throw new Error(FACTORY_FAILURE);
    __drivers.push(this);
    __currentDriver = this;
  }
  async query(sql: string): Promise<{ rows: never[] }> {
    this.statements.push(sql);
    failIfMatches(sql);
    return { rows: [] };
  }
  async connect(): Promise<{
    query: (sql: string, params?: readonly unknown[]) => Promise<{ command: string; rowCount: number; rows: never[] }>;
    release: () => void;
  }> {
    return {
      query: async (sql: string, params: readonly unknown[] = []) => {
        void params;
        this.statements.push(sql);
        failIfMatches(sql);
        return { command: 'SELECT', rowCount: 0, rows: [] as never[] };
      },
      release: () => undefined,
    };
  }
  async end(): Promise<void> {
    recordDriverClose(this);
    this.closed = true;
    this.closes += 1;
  }
}

/**
 * `pg` は `Pool` を名前付きと `default` の両方から出す。 実装は `default?.Pool` を先に
 * 見るため両方置く。
 */
vi.mock('pg', () => ({ Pool: FakePgPool, default: { Pool: FakePgPool } }));

/** `prisma db push` の起動。 0 以外にすると失敗経路、 投げると起動そのものの失敗。 */
let __spawnStatus = 0;
let __spawnThrows = false;
const __spawnCalls: string[][] = [];

vi.mock('node:child_process', () => ({
  spawnSync: (cmd: string, args: string[]) => {
    void cmd;
    __spawnCalls.push(args);
    if (__spawnThrows) throw new Error(SPAWN_FAILURE);
    return {
      status: __spawnStatus,
      stdout: __spawnStatus === 0 ? 'pushed' : '',
      // 再試行の条件 (接続を受けていない) に当たらない文言にする。
      stderr: __spawnStatus === 0 ? '' : 'schema is invalid',
      error: undefined,
    };
  },
}));

class FakePrismaClient implements ClosableDriver {
  closed = false;
  closes = 0;
  constructor(public readonly opts: { datasourceUrl: string }) {
    __drivers.push(this);
    __currentDriver = this;
  }
  async $disconnect(): Promise<void> {
    recordDriverClose(this);
    this.closed = true;
    this.closes += 1;
  }
}

/** 生成そのものが失敗する client。 prisma 経路の driver factory 失敗にあたる。 */
class ExplodingPrismaClient {
  constructor() {
    throw new Error(FACTORY_FAILURE);
  }
}

const { setupOrmEnv } = await import('../src/index.js');

type SetupOpts = Parameters<typeof setupOrmEnv>[0];

/** 実装は overload で組合せを絞るため、 検査側は union を外して渡す。 */
async function setupLive(overrides: Record<string, unknown>): Promise<{ stop: () => Promise<void> }> {
  const env = await setupOrmEnv({ ...overrides } as unknown as SetupOpts);
  return env as unknown as { stop: () => Promise<void> };
}

const drizzleLive = (dialect: 'postgres' | 'mysql', overrides: Record<string, unknown> = {}): Promise<unknown> =>
  setupLive({ mode: 'live', orm: 'drizzle', dialect, schema: {}, ...overrides });

const kyselyLive = (dialect: 'postgres' | 'mysql', overrides: Record<string, unknown> = {}): Promise<unknown> =>
  setupLive({ mode: 'live', orm: 'kysely', dialect, schema: {}, ...overrides });

const prismaLive = (dialect: 'postgres' | 'mysql', overrides: Record<string, unknown> = {}): Promise<unknown> =>
  setupLive({
    mode: 'live',
    orm: 'prisma',
    dialect,
    prismaClient: FakePrismaClient,
    schemaPath: '/tmp/schema.prisma',
    ...overrides,
  });

/** 投げる seed。 container を起こした後の最後の失敗地点。 */
const explodingSeed = async (): Promise<never> => {
  throw new Error(SEED_FAILURE);
};

/** 片付けが起きた瞬間の相手の状態を問う。 終わった後の 2 状態では逆順でも通る。 */
function expectDriverClosedBeforeContainerStopped(): void {
  const closeMoment = __moments.find((m) => m.event === 'driver.close');
  const stopMoment = __moments.find((m) => m.event === 'container.stop');
  expect(closeMoment, 'driver を閉じる').toBeDefined();
  expect(stopMoment, 'container を止める').toBeDefined();
  expect(closeMoment?.containerStopped, 'driver を閉じる時点で container はまだ動いている').toBe(false);
  expect(stopMoment?.driverClosed, 'container を止める時点で driver は閉じ終わっている').toBe(true);
}

/** driver も container も片付いたことを、 数まで含めて見る。 */
function expectCleanedUp(): void {
  expect(__drivers, 'driver を 1 本作っている').toHaveLength(1);
  expect(__drivers[0]?.closed, 'driver を閉じない と接続が残る').toBe(true);
  expect(__drivers[0]?.closes, 'driver を閉じるのは 1 度だけ').toBe(1);
  expect(__containers, 'container を 1 つ起こしている').toHaveLength(1);
  expect(__containers[0]?.stopped, 'container を止めない と docker ps に残る').toBe(true);
  expect(__containers[0]?.stops, 'container を止めるのは 1 度だけ').toBe(1);
  expectDriverClosedBeforeContainerStopped();
}

/** driver を作る前に投げた形。 片付けるのは container だけ。 */
function expectContainerOnlyCleanedUp(): void {
  expect(__drivers, 'driver は 1 本も作られない').toHaveLength(0);
  expect(__containers, 'container を 1 つ起こしている').toHaveLength(1);
  expect(__containers[0]?.stopped, 'driver が無くても container は止める').toBe(true);
  expect(__containers[0]?.stops, 'container を止めるのは 1 度だけ').toBe(1);
}

const ENV_NAME = 'DATABASE_URL';
let __previousDatabaseUrl: string | undefined;

beforeEach(() => {
  __moments.length = 0;
  __containers.length = 0;
  __drivers.length = 0;
  __spawnCalls.length = 0;
  __currentDriver = null;
  __currentContainer = null;
  __startFails = false;
  __driverFactoryFails = false;
  __failingStatement = null;
  __spawnStatus = 0;
  __spawnThrows = false;
  __previousDatabaseUrl = process.env[ENV_NAME];
  delete process.env[ENV_NAME];
});

afterEach(() => {
  if (typeof __previousDatabaseUrl === 'string') process.env[ENV_NAME] = __previousDatabaseUrl;
  else delete process.env[ENV_NAME];
});

describe('setupOrmEnv — drizzle + live + postgres の起動後の失敗 (#2173)', () => {
  it('T-LSC-001 seed が投げたら driver を閉じてから container を止め、 同じ理由を投げ直す', async () => {
    await expect(drizzleLive('postgres', { seed: explodingSeed }), '元の理由を投げ直す').rejects.toThrow(SEED_FAILURE);
    expectCleanedUp();
  });

  it('T-LSC-002 driver factory が投げたら container を止める', async () => {
    __driverFactoryFails = true;
    await expect(drizzleLive('postgres')).rejects.toThrow(FACTORY_FAILURE);
    expectContainerOnlyCleanedUp();
  });

  it('T-LSC-003 folder migration が投げたら driver を閉じてから container を止める', async () => {
    await expect(drizzleLive('postgres', { migrations: { folder: MISSING_FOLDER } })).rejects.toThrow();
    expectCleanedUp();
  });

  it('T-LSC-004 inline SQL が投げたら driver を閉じてから container を止める', async () => {
    __failingStatement = 'boom_users';
    await expect(
      drizzleLive('postgres', { migrations: 'CREATE TABLE boom_users (id SERIAL);' }),
    ).rejects.toThrow(STATEMENT_FAILURE);
    expectCleanedUp();
  });
});

describe('setupOrmEnv — drizzle + live + mysql の起動後の失敗 (#2173)', () => {
  it('T-LSC-101 seed が投げたら pool を閉じてから container を止め、 同じ理由を投げ直す', async () => {
    await expect(drizzleLive('mysql', { seed: explodingSeed })).rejects.toThrow(SEED_FAILURE);
    expectCleanedUp();
  });

  it('T-LSC-102 driver factory が投げたら container を止める', async () => {
    __driverFactoryFails = true;
    await expect(drizzleLive('mysql')).rejects.toThrow(FACTORY_FAILURE);
    expectContainerOnlyCleanedUp();
  });

  it('T-LSC-103 folder migration が投げたら pool を閉じてから container を止める', async () => {
    await expect(drizzleLive('mysql', { migrations: { folder: MISSING_FOLDER } })).rejects.toThrow();
    expectCleanedUp();
  });

  it('T-LSC-104 inline SQL が投げたら pool を閉じてから container を止める', async () => {
    __failingStatement = 'boom_users';
    await expect(drizzleLive('mysql', { migrations: 'CREATE TABLE boom_users (id INT);' })).rejects.toThrow(
      STATEMENT_FAILURE,
    );
    expectCleanedUp();
  });
});

describe('setupOrmEnv — prisma + live + postgres の起動後の失敗 (#2173)', () => {
  it('T-LSC-201 seed が投げたら client を切ってから container を止め、 環境変数も戻す', async () => {
    process.env[ENV_NAME] = 'postgres://previous@127.0.0.1:5432/prev';

    await expect(prismaLive('postgres', { seed: explodingSeed })).rejects.toThrow(SEED_FAILURE);

    expectCleanedUp();
    expect(process.env[ENV_NAME], '環境変数を元へ戻す').toBe('postgres://previous@127.0.0.1:5432/prev');
  });

  it('T-LSC-202 client の生成が投げたら container を止め、 環境変数も戻す', async () => {
    await expect(prismaLive('postgres', { prismaClient: ExplodingPrismaClient })).rejects.toThrow(FACTORY_FAILURE);

    expectContainerOnlyCleanedUp();
    expect(ENV_NAME in process.env, '元が無いので削除して戻す').toBe(false);
  });

  it('T-LSC-203 db push の起動そのものが投げたら container を止め、 環境変数も戻す', async () => {
    process.env[ENV_NAME] = 'postgres://previous@127.0.0.1:5432/prev';
    __spawnThrows = true;

    await expect(prismaLive('postgres')).rejects.toThrow(SPAWN_FAILURE);

    expectContainerOnlyCleanedUp();
    expect(__spawnCalls, 'db push を起こそうとはしている').toHaveLength(1);
    expect(process.env[ENV_NAME], '環境変数を元へ戻す').toBe('postgres://previous@127.0.0.1:5432/prev');
  });
});

describe('setupOrmEnv — prisma + live + mysql の起動後の失敗 (#2173)', () => {
  it('T-LSC-301 seed が投げたら client を切ってから container を止め、 環境変数も戻す', async () => {
    process.env[ENV_NAME] = 'mysql://previous@127.0.0.1:3306/prev';

    await expect(prismaLive('mysql', { seed: explodingSeed })).rejects.toThrow(SEED_FAILURE);

    expectCleanedUp();
    expect(process.env[ENV_NAME], '環境変数を元へ戻す').toBe('mysql://previous@127.0.0.1:3306/prev');
  });

  it('T-LSC-302 client の生成が投げたら container を止め、 環境変数も戻す', async () => {
    await expect(prismaLive('mysql', { prismaClient: ExplodingPrismaClient })).rejects.toThrow(FACTORY_FAILURE);

    expectContainerOnlyCleanedUp();
    expect(ENV_NAME in process.env, '元が無いので削除して戻す').toBe(false);
  });

  it('T-LSC-303 db push の起動そのものが投げたら container を止め、 環境変数も戻す', async () => {
    process.env[ENV_NAME] = 'mysql://previous@127.0.0.1:3306/prev';
    __spawnThrows = true;

    await expect(prismaLive('mysql')).rejects.toThrow(SPAWN_FAILURE);

    expectContainerOnlyCleanedUp();
    expect(process.env[ENV_NAME], '環境変数を元へ戻す').toBe('mysql://previous@127.0.0.1:3306/prev');
  });
});

describe('setupOrmEnv — kysely + live + postgres の起動後の失敗 (#2173)', () => {
  it('T-LSC-401 seed が投げたら pool を閉じてから container を止め、 同じ理由を投げ直す', async () => {
    await expect(kyselyLive('postgres', { seed: explodingSeed })).rejects.toThrow(SEED_FAILURE);
    expectCleanedUp();
  });

  it('T-LSC-402 driver factory が投げたら container を止める', async () => {
    __driverFactoryFails = true;
    await expect(kyselyLive('postgres')).rejects.toThrow(FACTORY_FAILURE);
    expectContainerOnlyCleanedUp();
  });

  it('T-LSC-403 Migrator が投げたら pool を閉じてから container を止める', async () => {
    await expect(kyselyLive('postgres', { migrations: { folder: MISSING_FOLDER } })).rejects.toThrow(
      /migrateToLatest failed/,
    );
    expectCleanedUp();
  });

  it('T-LSC-404 inline SQL が投げたら pool を閉じてから container を止める', async () => {
    __failingStatement = 'boom_users';
    await expect(kyselyLive('postgres', { migrations: 'CREATE TABLE boom_users (id SERIAL);' })).rejects.toThrow(
      STATEMENT_FAILURE,
    );
    expectCleanedUp();
  });
});

describe('setupOrmEnv — kysely + live + mysql の起動後の失敗 (#2173)', () => {
  it('T-LSC-501 seed が投げたら pool を閉じてから container を止め、 同じ理由を投げ直す', async () => {
    await expect(kyselyLive('mysql', { seed: explodingSeed })).rejects.toThrow(SEED_FAILURE);
    expectCleanedUp();
  });

  it('T-LSC-502 driver factory が投げたら container を止める', async () => {
    __driverFactoryFails = true;
    await expect(kyselyLive('mysql')).rejects.toThrow(FACTORY_FAILURE);
    expectContainerOnlyCleanedUp();
  });

  it('T-LSC-503 Migrator が投げたら pool を閉じてから container を止める', async () => {
    await expect(kyselyLive('mysql', { migrations: { folder: MISSING_FOLDER } })).rejects.toThrow(
      /migrateToLatest failed/,
    );
    expectCleanedUp();
  });

  it('T-LSC-504 inline SQL が投げたら pool を閉じてから container を止める', async () => {
    __failingStatement = 'boom_users';
    await expect(kyselyLive('mysql', { migrations: 'CREATE TABLE boom_users (id INT);' })).rejects.toThrow(
      STATEMENT_FAILURE,
    );
    expectCleanedUp();
  });
});

describe('setupOrmEnv — kysely + live + mysql の container 起動失敗の案内 (#2173)', () => {
  it('T-LSC-601 image と docker ps の確認と元の理由の 3 つを添える', async () => {
    __startFails = true;

    const message = await kyselyLive('mysql').then(
      () => '',
      (caught: unknown) => String((caught as Error).message),
    );

    expect(message, '起動に失敗したら投げる').not.toBe('');
    expect(message).toContain('failed to start MySQL testcontainer');
    // どの image で失敗したかが無いと、 pull 待ちなのか image 名の誤りなのか読めない。
    expect(message, '既定の image を名指しする').toContain('image=mysql:8.4');
    // 6 経路のうちこの 1 つだけ確認手順を欠いていた (#2173 の MINOR)。
    expect(message, '次に何を確かめるかを示す').toContain('`docker ps` should succeed');
    expect(message, '元の理由を落とさない').toContain(START_FAILURE);
    // 起動できていないので driver も container も片付ける対象が無い。
    expect(__drivers, 'driver を作らない').toHaveLength(0);
    expect(__containers, 'container は起きていない').toHaveLength(0);
  });

  it('T-LSC-602 指定した image で失敗したら、 その image を名指しする', async () => {
    __startFails = true;
    const message = await kyselyLive('mysql', { containerImage: 'mysql:8.0' }).then(
      () => '',
      (caught: unknown) => String((caught as Error).message),
    );
    expect(message, '既定ではなく指定値を返す').toContain('image=mysql:8.0');
    expect(message).not.toContain('mysql:8.4');
  });
});
