/**
 * `setupOrmEnv` の prisma + mock + sqlite 経路を覆う検査 (Issue #1941)。
 *
 * この経路は外部コマンド (`prisma db push`) を 1 回起動する。 それ以外は
 * 一時 dir の確保・環境変数の退避と復元・呼び出し側が渡した接続クラスの生成で、
 * いずれも手元で完結する。 起動を差し替えれば prisma も SQLite も要らない。
 *
 * 差し替えるのは `node:child_process` だけにする。 一時 dir の確保は
 * `@kiwa-lab/core` の実装をそのまま使う (実際に dir を作って消す方が、
 * 後始末が実際に効いているかまで確かめられる)。
 *
 * ## 環境変数の退避を確かめる理由
 *
 * この経路は接続先を環境変数で渡すため、実行中だけ書き換えて終了時に戻す。
 * 戻し方は元の値があったかどうかで変わり (代入と削除)、失敗した時も戻す必要がある。
 * 戻し損ねると、同じ変数を読む後続の検査が別の接続先を掴む。
 */
import { existsSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface SpawnCall {
  cmd: string;
  args: string[];
  opts: { env?: NodeJS.ProcessEnv };
}

const __spawnCalls: SpawnCall[] = [];
/** `prisma db push` の終了コード。 0 以外にすると失敗経路へ倒れる。 */
let __spawnStatus = 0;

vi.mock('node:child_process', () => ({
  spawnSync: (cmd: string, args: string[], opts: { env?: NodeJS.ProcessEnv }) => {
    __spawnCalls.push({ cmd, args, opts });
    return {
      status: __spawnStatus,
      stdout: __spawnStatus === 0 ? 'pushed' : '',
      stderr: __spawnStatus === 0 ? '' : 'schema is invalid',
    };
  },
}));

/** 起動した容器。 停止まで確かめるために残す。 */
const __containers: FakePostgresContainer[] = [];
/** 起動そのものを失敗させる切替。 Docker が居ない環境の再現に使う。 */
let __containerStartFails = false;

class FakePostgresContainer {
  stopped = false;
  constructor(public readonly image: string) {}
  async start(): Promise<FakePostgresContainer> {
    if (__containerStartFails) throw new Error('Cannot connect to the Docker daemon');
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

vi.mock('@testcontainers/postgresql', () => ({
  PostgreSqlContainer: FakePostgresContainer,
}));

const { setupOrmEnv } = await import('../src/index.js');

/**
 * この経路が返す形。 `setupOrmEnv` の戻り値は 9 経路の union なので、
 * 呼び出し側で絞らないと `dbPath` も `datasourceUrl` も見えない。
 */
interface PrismaMockEnv {
  mode: string;
  orm: string;
  dialect: string;
  client: unknown;
  dbPath: string;
  datasourceUrl: string;
  stop: () => Promise<void>;
}

/** 呼び出し側が渡す接続クラスの代わり。 生成と切断を記録する。 */
class FakePrismaClient {
  static instances: FakePrismaClient[] = [];
  disconnectCalls = 0;
  constructor(public readonly opts: { datasourceUrl: string }) {
    FakePrismaClient.instances.push(this);
  }
  async $disconnect(): Promise<void> {
    this.disconnectCalls += 1;
  }
}

/** 切断口を持たない接続クラス。 呼べない相手を呼ばないことの確認に使う。 */
class NoDisconnectClient {
  constructor(public readonly opts: { datasourceUrl: string }) {}
}

/** 切断が失敗する接続クラス。 失敗を握りつぶして片付けへ進むかを見る。 */
class FailingDisconnectClient {
  constructor(public readonly opts: { datasourceUrl: string }) {}
  async $disconnect(): Promise<void> {
    throw new Error('connection already gone');
  }
}

const ENV_KEY = 'DATABASE_URL';

/**
 * 検査が触る環境変数。 既定名と、名前を指定する検査が使う 2 つ。
 *
 * 3 つとも同じ形で退避して戻す。 削除だけにすると、元から値が入っていた場合に
 * 検査がそれを消してしまう (実装は元の値を戻す作りなので、検査側だけ非対称になる)。
 */
const MANAGED_ENV_KEYS = [ENV_KEY, 'ORM_TEST_URL', 'ORM_PG_URL'] as const;
const previousEnv = new Map<string, string | undefined>();

beforeEach(() => {
  __spawnCalls.length = 0;
  __spawnStatus = 0;
  __containers.length = 0;
  __containerStartFails = false;
  FakePrismaClient.instances.length = 0;
  previousEnv.clear();
  for (const key of MANAGED_ENV_KEYS) previousEnv.set(key, process.env[key]);
});

afterEach(() => {
  // 検査が途中で落ちると実装側の後始末に到達しないため、ここで戻す。
  for (const key of MANAGED_ENV_KEYS) {
    const prev = previousEnv.get(key);
    if (typeof prev === 'string') process.env[key] = prev;
    else delete process.env[key];
  }
});

/** この経路を起動する。 戻り値は union なので受け側で絞る。 */
async function setupPrismaMock(overrides: Record<string, unknown> = {}): Promise<PrismaMockEnv> {
  const opts = {
    mode: 'mock',
    orm: 'prisma',
    dialect: 'sqlite',
    prismaClient: FakePrismaClient,
    schemaPath: '/tmp/schema.prisma',
    ...overrides,
  };
  const env = await setupOrmEnv(opts as unknown as Parameters<typeof setupOrmEnv>[0]);
  return env as unknown as PrismaMockEnv;
}

/** 置き場の親 dir。 片付けが効いたかを見るために使う。 */
function tempDirOf(env: PrismaMockEnv): string {
  return env.dbPath.replace(/\/test\.db$/, '');
}

describe('setupOrmEnv — prisma + mock + sqlite の組み立て', () => {
  it('一時 dir に SQLite の置き場を作り、その接続先で client を生成する', async () => {
    const env = await setupPrismaMock();

    expect(env.mode).toBe('mock');
    expect(env.orm).toBe('prisma');
    expect(env.dialect).toBe('sqlite');
    expect(env.datasourceUrl).toBe(`file:${env.dbPath}`);
    // 一時 dir は実際に作られている。
    expect(existsSync(tempDirOf(env))).toBe(true);

    expect(FakePrismaClient.instances[0]?.opts.datasourceUrl).toBe(env.datasourceUrl);

    await env.stop();
  });

  it('スキーマの反映を外部コマンドに任せ、破壊を許す形で呼ぶ', async () => {
    const env = await setupPrismaMock({ schemaPath: '/schemas/app.prisma' });

    expect(__spawnCalls).toHaveLength(1);
    expect(__spawnCalls[0]?.cmd).toBe('pnpm');
    expect(__spawnCalls[0]?.args).toEqual([
      'exec',
      'prisma',
      'db',
      'push',
      '--schema=/schemas/app.prisma',
      '--skip-generate',
      '--accept-data-loss',
    ]);
    // 起動する子には接続先を渡す。 渡さないと既定の接続先へ書きにいく。
    expect(__spawnCalls[0]?.opts.env?.[ENV_KEY]).toBe(env.datasourceUrl);

    await env.stop();
  });

  it('接続先の変数名を指定できる', async () => {
    const env = await setupPrismaMock({ datasourceUrlEnv: 'ORM_TEST_URL' });

    expect(__spawnCalls[0]?.opts.env?.ORM_TEST_URL).toBe(env.datasourceUrl);
    expect(process.env.ORM_TEST_URL).toBe(env.datasourceUrl);

    await env.stop();
    // 指定した変数も終了時に片付ける。 確認は key の有無で行う
    // (値の比較だと、key が残って中身だけ空の状態を見逃す)。
    expect('ORM_TEST_URL' in process.env).toBe(false);
  });

  it('種を渡すと client を受け取って一度だけ呼ばれる', async () => {
    const seen: unknown[] = [];
    const env = await setupPrismaMock({
      seed: async (client: unknown) => {
        seen.push(client);
      },
    });

    expect(seen).toHaveLength(1);
    expect(seen[0]).toBe(FakePrismaClient.instances[0]);

    await env.stop();
  });
});

describe('setupOrmEnv — prisma + mock + sqlite の環境変数の扱い', () => {
  it('元の値がある時は終了時に元へ戻す', async () => {
    process.env[ENV_KEY] = 'file:/original.db';

    const env = await setupPrismaMock();
    expect(process.env[ENV_KEY]).toBe(env.datasourceUrl);

    await env.stop();
    expect(process.env[ENV_KEY]).toBe('file:/original.db');
  });

  it('元の値が無い時は終了時に消す', async () => {
    delete process.env[ENV_KEY];

    const env = await setupPrismaMock();
    expect(process.env[ENV_KEY]).toBe(env.datasourceUrl);

    await env.stop();
    expect(ENV_KEY in process.env).toBe(false);
  });
});

describe('setupOrmEnv — prisma + mock + sqlite の失敗と後始末', () => {
  it('スキーマ反映が失敗したら理由を添えて投げる', async () => {
    __spawnStatus = 2;

    await expect(setupPrismaMock()).rejects.toThrow(
      /prisma db push failed \(status=2\).*schema is invalid/s,
    );
  });

  it('失敗しても環境変数を元へ戻す', async () => {
    process.env[ENV_KEY] = 'file:/original.db';
    __spawnStatus = 1;

    await expect(setupPrismaMock()).rejects.toThrow();
    expect(process.env[ENV_KEY]).toBe('file:/original.db');
  });

  it('失敗して元の値が無ければ消す', async () => {
    delete process.env[ENV_KEY];
    __spawnStatus = 1;

    await expect(setupPrismaMock()).rejects.toThrow();
    expect(ENV_KEY in process.env).toBe(false);
  });

  it('終了時に接続を切り、置き場も消す', async () => {
    const env = await setupPrismaMock();
    const dir = tempDirOf(env);
    expect(existsSync(dir)).toBe(true);

    await env.stop();

    expect(FakePrismaClient.instances[0]?.disconnectCalls).toBe(1);
    expect(existsSync(dir)).toBe(false);
  });

  it('切断口を持たない client でも終了できる', async () => {
    const env = await setupPrismaMock({ prismaClient: NoDisconnectClient });
    const dir = tempDirOf(env);

    await expect(env.stop()).resolves.toBeUndefined();
    expect(existsSync(dir)).toBe(false);
  });

  it('切断が失敗しても置き場の片付けは進める', async () => {
    const env = await setupPrismaMock({ prismaClient: FailingDisconnectClient });
    const dir = tempDirOf(env);

    await expect(env.stop()).resolves.toBeUndefined();
    // 切断の失敗を握りつぶさないと、置き場が残り続ける。
    expect(existsSync(dir)).toBe(false);
  });
});

/**
 * 以下は live + postgres 経路。 mock 経路と違い、接続先は容器が決める。
 * 容器の起動を差し替えれば Docker は要らない。
 */
interface PrismaLiveEnv {
  mode: string;
  orm: string;
  dialect: string;
  client: unknown;
  connectionUri: string;
  stop: () => Promise<void>;
}

async function setupPrismaLivePostgres(
  overrides: Record<string, unknown> = {},
): Promise<PrismaLiveEnv> {
  const opts = {
    mode: 'live',
    orm: 'prisma',
    dialect: 'postgres',
    prismaClient: FakePrismaClient,
    schemaPath: '/tmp/schema.prisma',
    ...overrides,
  };
  const env = await setupOrmEnv(opts as unknown as Parameters<typeof setupOrmEnv>[0]);
  return env as unknown as PrismaLiveEnv;
}

describe('setupOrmEnv — prisma + live + postgres の組み立て', () => {
  it('容器を起こし、その接続先で client を生成する', async () => {
    const env = await setupPrismaLivePostgres();

    expect(env.mode).toBe('live');
    expect(env.orm).toBe('prisma');
    expect(env.dialect).toBe('postgres');
    expect(env.connectionUri).toBe('postgres://user:pass@127.0.0.1:55432/test');
    expect(__containers).toHaveLength(1);
    expect(__containers[0]?.image).toBe('postgres:16-alpine');
    expect(FakePrismaClient.instances[0]?.opts.datasourceUrl).toBe(env.connectionUri);

    await env.stop();
  });

  it('容器の像を指定できる', async () => {
    const env = await setupPrismaLivePostgres({ containerImage: 'postgres:15' });

    expect(__containers[0]?.image).toBe('postgres:15');

    await env.stop();
  });

  it('接続先を環境変数に置き、外部コマンドにも渡す', async () => {
    const env = await setupPrismaLivePostgres({ datasourceUrlEnv: 'ORM_PG_URL' });

    expect(process.env.ORM_PG_URL).toBe(env.connectionUri);
    expect(__spawnCalls[0]?.opts.env?.ORM_PG_URL).toBe(env.connectionUri);

    await env.stop();
    expect('ORM_PG_URL' in process.env).toBe(false);
  });

  it('種を渡すと client を受け取って呼ばれる', async () => {
    const seen: unknown[] = [];
    const env = await setupPrismaLivePostgres({
      seed: async (client: unknown) => {
        seen.push(client);
      },
    });

    expect(seen).toEqual([FakePrismaClient.instances[0]]);

    await env.stop();
  });

  it('容器が起きなければ Docker の確認を促して投げる', async () => {
    __containerStartFails = true;

    await expect(setupPrismaLivePostgres()).rejects.toThrow(
      /failed to start Postgres testcontainer \(image=postgres:16-alpine\).*Docker daemon/s,
    );
    // 起きていない容器を止めにいかない。
    expect(__containers).toHaveLength(0);
  });

  it('スキーマ反映が失敗したら容器を止め、環境変数も戻して投げる', async () => {
    process.env[ENV_KEY] = 'postgres://original';
    __spawnStatus = 3;

    await expect(setupPrismaLivePostgres()).rejects.toThrow(
      /prisma db push failed against testcontainers Postgres \(status=3\)/,
    );
    expect(__containers[0]?.stopped).toBe(true);
    expect(process.env[ENV_KEY]).toBe('postgres://original');
  });

  it('失敗して元の値が無ければ環境変数を消す', async () => {
    delete process.env[ENV_KEY];
    __spawnStatus = 3;

    await expect(setupPrismaLivePostgres()).rejects.toThrow();
    expect(ENV_KEY in process.env).toBe(false);
  });

  it('終了時に接続を切り、容器も止める', async () => {
    const env = await setupPrismaLivePostgres();

    await env.stop();

    expect(FakePrismaClient.instances[0]?.disconnectCalls).toBe(1);
    expect(__containers[0]?.stopped).toBe(true);
  });

  it('切断口が無い client でも容器は止まる', async () => {
    const env = await setupPrismaLivePostgres({ prismaClient: NoDisconnectClient });

    await env.stop();

    expect(__containers[0]?.stopped).toBe(true);
  });

  it('切断が失敗しても容器は止める', async () => {
    const env = await setupPrismaLivePostgres({ prismaClient: FailingDisconnectClient });

    await expect(env.stop()).resolves.toBeUndefined();
    expect(__containers[0]?.stopped).toBe(true);
  });
});
