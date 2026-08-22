/**
 * `setupOrmEnv` の prisma + live + mysql 経路を覆う検査 (Issue #2161)。
 *
 * この経路は coverage 上 **実行回数 0** だった。 同じ形の prisma + live + postgres は
 * `prisma-mock-setup.test.ts` が container を差し替えて覆っており、mysql 側だけが
 * 抜けていた。
 *
 * ## 何を差し替えるか
 *
 * container (`@testcontainers/mysql`) と外部 command の起動 (`node:child_process`) だけ。
 * 接続先を環境変数へ載せる処理と client の生成は実装をそのまま通す。
 *
 * ## 環境変数の退避を確かめる理由
 *
 * この経路は接続先を環境変数で渡すため、実行中だけ書き換えて終了時に戻す。
 * 戻し方は元の値があったかどうかで変わり (代入と削除)、`db push` が失敗した時も戻す。
 * 戻し損ねると、同じ変数を読む後続の検査が別の接続先を掴む。
 */
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
      // 再試行の条件 (接続を受けていない) に当たらない文言にする。
      // 当たると上限まで 500ms 間隔で回り続ける。
      stderr: __spawnStatus === 0 ? '' : 'schema is invalid',
    };
  },
}));

/** 起動した容器。 停止まで確かめるために残す。 */
const __containers: FakeMySqlContainer[] = [];
let __startFails = false;

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

vi.mock('@testcontainers/mysql', () => ({ MySqlContainer: FakeMySqlContainer }));

class FakePrismaClient {
  static instances: FakePrismaClient[] = [];
  disconnected = false;
  constructor(public readonly opts: { datasourceUrl: string }) {
    FakePrismaClient.instances.push(this);
  }
  async $disconnect(): Promise<void> {
    this.disconnected = true;
  }
}

/** 切断で失敗する client。 失敗しても後始末が進むかを見る。 */
class FailingDisconnectClient extends FakePrismaClient {
  disconnectAttempts = 0;
  override async $disconnect(): Promise<void> {
    this.disconnectAttempts += 1;
    throw new Error('disconnect failed');
  }
}

const { setupOrmEnv } = await import('../src/index.js');

interface PrismaLiveEnv {
  mode: string;
  orm: string;
  dialect: string;
  client: FakePrismaClient;
  connectionUri: string;
  stop: () => Promise<void>;
}

const ENV_NAME = 'DATABASE_URL';

async function setupPrismaLiveMysql(
  overrides: Record<string, unknown> = {},
): Promise<PrismaLiveEnv> {
  const env = await setupOrmEnv({
    mode: 'live',
    orm: 'prisma',
    dialect: 'mysql',
    prismaClient: FakePrismaClient,
    schemaPath: '/tmp/schema.prisma',
    ...overrides,
  } as unknown as Parameters<typeof setupOrmEnv>[0]);
  return env as unknown as PrismaLiveEnv;
}

let __previousDatabaseUrl: string | undefined;

beforeEach(() => {
  __spawnCalls.length = 0;
  __containers.length = 0;
  FakePrismaClient.instances.length = 0;
  __spawnStatus = 0;
  __startFails = false;
  __previousDatabaseUrl = process.env[ENV_NAME];
  delete process.env[ENV_NAME];
});

afterEach(() => {
  // 検査どうしが環境変数を持ち越さないようにする。
  if (typeof __previousDatabaseUrl === 'string') process.env[ENV_NAME] = __previousDatabaseUrl;
  else delete process.env[ENV_NAME];
});

describe('setupOrmEnv — prisma + live + mysql (#2161)', () => {
  it('T-PLM-001 容器を起こし、その接続先で client を生成する', async () => {
    const env = await setupPrismaLiveMysql();

    expect(env.mode).toBe('live');
    expect(env.orm).toBe('prisma');
    expect(env.dialect).toBe('mysql');
    expect(env.connectionUri).toBe('mysql://user:pass@127.0.0.1:33306/test');
    expect(__containers).toHaveLength(1);
    expect(__containers[0]?.image, '既定の image').toBe('mysql:8.4');
    expect(FakePrismaClient.instances[0]?.opts.datasourceUrl).toBe(env.connectionUri);

    await env.stop();
  });

  it('T-PLM-002 image を指定できる', async () => {
    const env = await setupPrismaLiveMysql({ containerImage: 'mysql:8.0' });
    expect(__containers[0]?.image).toBe('mysql:8.0');
    await env.stop();
  });

  it('T-PLM-003 db push に接続先を渡して 1 度だけ起動する', async () => {
    const env = await setupPrismaLiveMysql();

    expect(__spawnCalls, '成功したら再試行しない').toHaveLength(1);
    expect(__spawnCalls[0]?.args).toContain('--schema=/tmp/schema.prisma');
    // 接続先を env で渡さないと、db push は既定の接続先を掴む。
    expect(__spawnCalls[0]?.opts.env?.[ENV_NAME]).toBe(env.connectionUri);

    await env.stop();
  });

  it('T-PLM-004 実行中は環境変数に接続先が載り、stop で消える', async () => {
    const env = await setupPrismaLiveMysql();
    expect(process.env[ENV_NAME], '実行中は接続先が載る').toBe(env.connectionUri);

    await env.stop();

    // 元が無かったので、戻すのではなく消す。
    expect(ENV_NAME in process.env, '元が無い時は削除して戻す').toBe(false);
  });

  it('T-PLM-005 元の値があれば stop で元へ戻す', async () => {
    process.env[ENV_NAME] = 'mysql://previous@127.0.0.1:3306/prev';
    const env = await setupPrismaLiveMysql();
    expect(process.env[ENV_NAME]).toBe(env.connectionUri);

    await env.stop();

    expect(process.env[ENV_NAME], '元の値へ戻す').toBe('mysql://previous@127.0.0.1:3306/prev');
  });

  it('T-PLM-006 環境変数の名前を指定できる', async () => {
    const env = await setupPrismaLiveMysql({ datasourceUrlEnv: 'MYSQL_URL' });
    expect(process.env['MYSQL_URL']).toBe(env.connectionUri);
    expect(ENV_NAME in process.env, '既定の名前は触らない').toBe(false);
    await env.stop();
    expect('MYSQL_URL' in process.env).toBe(false);
  });

  it('T-PLM-007 db push が失敗したら容器を止め、環境変数も戻す', async () => {
    process.env[ENV_NAME] = 'mysql://previous@127.0.0.1:3306/prev';
    __spawnStatus = 1;

    await expect(setupPrismaLiveMysql()).rejects.toThrow(/prisma db push failed/);

    // 失敗経路で片付けないと、容器と環境変数が残る。
    expect(__containers[0]?.stopped, '容器を止める').toBe(true);
    expect(process.env[ENV_NAME], '環境変数を戻す').toBe('mysql://previous@127.0.0.1:3306/prev');
  });

  it('T-PLM-008 元が無い時は db push が失敗しても環境変数を消して戻す', async () => {
    // T-PLM-007 は元の値がある形。 戻し方は元の有無で分岐する (代入と削除) ので、
    // 片方だけだと削除側が一度も通らない。
    __spawnStatus = 1;
    expect(ENV_NAME in process.env, '前提 = 元の値は無い').toBe(false);

    await expect(setupPrismaLiveMysql()).rejects.toThrow(/prisma db push failed/);

    expect(ENV_NAME in process.env, '元が無いので削除して戻す').toBe(false);
    expect(__containers[0]?.stopped, '容器も止める').toBe(true);
  });

  it('T-PLM-009 db push の失敗には stderr を添える', async () => {
    __spawnStatus = 1;
    await expect(setupPrismaLiveMysql()).rejects.toThrow(/schema is invalid/);
  });

  it('T-PLM-010 seed に生成した client を渡す', async () => {
    const seen: unknown[] = [];
    const env = await setupPrismaLiveMysql({
      seed: async (client: unknown) => {
        seen.push(client);
      },
    });
    expect(seen).toHaveLength(1);
    expect(seen[0]).toBe(env.client);
    await env.stop();
  });

  it('T-PLM-011 stop で client を切断し、容器も止める', async () => {
    const env = await setupPrismaLiveMysql();

    await env.stop();

    expect(env.client.disconnected, '切断しない と接続が残る').toBe(true);
    expect(__containers[0]?.stopped, '容器を止めない と Docker に残る').toBe(true);
  });

  it('T-PLM-012 切断が失敗しても容器の停止と環境変数の復元は進める', async () => {
    const env = await setupPrismaLiveMysql({ prismaClient: FailingDisconnectClient });
    expect(env.client).toBeInstanceOf(FailingDisconnectClient);

    await expect(env.stop(), '切断の失敗で止まらない').resolves.toBeUndefined();

    expect((env.client as FailingDisconnectClient).disconnectAttempts, '失敗する切断を実際に呼ぶ').toBe(1);
    expect(__containers[0]?.stopped).toBe(true);
    expect(ENV_NAME in process.env).toBe(false);
  });

  it('T-PLM-013 容器の起動に失敗したら image を名指しして知らせる', async () => {
    __startFails = true;
    await expect(setupPrismaLiveMysql()).rejects.toThrow(/mysql:8\.4/);
    expect(__spawnCalls, '容器が無いのに db push しない').toHaveLength(0);
  });
});
