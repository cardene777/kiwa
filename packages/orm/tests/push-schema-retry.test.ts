// `prisma db push` の再試行の判断を、 container を立てずに確かめる (#1724)。
//
// testcontainers の `start()` は container が立ったことしか保証せず、 MySQL /
// Postgres が接続を受けるのはその後になる。 直後に `db push` を叩くと弾かれるため、
// 接続を受けていないことが読み取れる間だけ再試行する。
//
// ここで見るのは「いつ再試行し、 いつ諦めるか」 の判断。 実際に container を立てる
// 経路は `live-mysql.test.ts` / `live-mode.test.ts` が受け持つ。

import { describe, expect, it } from 'vitest';
import { pushSchemaWithRetry } from '../src/setup-orm-env.js';

type SpawnResult = {
  status: number | null;
  stderr: string;
  stdout: string;
  error?: Error;
};
type SpawnSync = typeof import('node:child_process').spawnSync;
type SpawnOptions = { timeout?: number };

/** 呼ばれた回数を数えつつ、 用意した結果を順に返す `spawnSync` の代役。 */
function fakeSpawn(results: SpawnResult[]): {
  spawn: SpawnSync;
  calls: () => number;
  timeouts: () => (number | undefined)[];
} {
  let calls = 0;
  const timeouts: (number | undefined)[] = [];
  const spawn = ((_cmd: string, _args: string[], opts?: SpawnOptions) => {
    timeouts.push(opts?.timeout);
    const result = results[Math.min(calls, results.length - 1)];
    calls += 1;
    return result;
  }) as unknown as SpawnSync;
  return { spawn, calls: () => calls, timeouts: () => timeouts };
}

const REFUSED: SpawnResult = {
  status: 1,
  stderr: "Can't reach database server at localhost:33562",
  stdout: '',
};
const OK: SpawnResult = { status: 0, stderr: '', stdout: '' };

describe('pushSchemaWithRetry (#1724 container の接続待ち)', () => {
  it('T-PSR-001 一度で通れば再試行しない', () => {
    const { spawn, calls } = fakeSpawn([OK]);
    const result = pushSchemaWithRetry(spawn, '/schema.prisma', 'DATABASE_URL', 'mysql://x');
    expect(result.status).toBe(0);
    expect(calls()).toBe(1);
  });

  it('T-PSR-002 接続を受けていない間は繰り返し、 受けたら通る', () => {
    const { spawn, calls } = fakeSpawn([REFUSED, REFUSED, OK]);
    const result = pushSchemaWithRetry(spawn, '/schema.prisma', 'DATABASE_URL', 'mysql://x');
    expect(result.status).toBe(0);
    expect(calls()).toBe(3);
  });

  it('T-PSR-003 接続以外の理由では再試行せず、 その出力を返す', () => {
    // schema の誤りは繰り返しても同じ結果になる。 再試行すると、 本当の原因が
    // 上限まで待たされた末に出てくる。
    const schemaError: SpawnResult = {
      status: 1,
      stderr: 'Error validating model "User": field "id" is missing',
      stdout: '',
    };
    const { spawn, calls } = fakeSpawn([schemaError]);
    const result = pushSchemaWithRetry(spawn, '/schema.prisma', 'DATABASE_URL', 'mysql://x');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Error validating model');
    expect(calls()).toBe(1);
  });

  it('T-PSR-004 上限に達したら諦めて最後の出力を返す', () => {
    const { spawn, calls } = fakeSpawn([REFUSED]);
    const startedAt = Date.now();
    const result = pushSchemaWithRetry(
      spawn,
      '/schema.prisma',
      'DATABASE_URL',
      'mysql://x',
      600,
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Can't reach database server");
    // 上限を超えて回り続けない。
    expect(Date.now() - startedAt).toBeLessThan(5_000);
    expect(calls()).toBeGreaterThan(1);
  });

  it('T-PSR-006 1 回の呼出にも残り時間を上限として渡す', () => {
    // 上限を呼出後にしか見ないと、 接続先で止まった `db push` が戻らない限り
    // 判定に到達せず、 全体テストごと止まる。
    const { spawn, timeouts } = fakeSpawn([REFUSED, REFUSED, OK]);
    pushSchemaWithRetry(spawn, '/schema.prisma', 'DATABASE_URL', 'mysql://x', 5_000);
    expect(timeouts().length).toBe(3);
    for (const t of timeouts()) {
      expect(t, '呼出に上限が渡っていない').toBeTypeOf('number');
      expect(t!).toBeGreaterThan(0);
      expect(t!).toBeLessThanOrEqual(5_000);
    }
    // 残り時間なので、 後の呼出ほど短くなる。
    expect(timeouts()[2]!).toBeLessThan(timeouts()[0]!);
  });

  it('T-PSR-007 起動できなかった理由を最後の出力に残す', () => {
    // 打ち切り / 起動失敗は `error` にしか出ない。 落とすと原因が空になる。
    const killed: SpawnResult = {
      status: null,
      stderr: '',
      stdout: '',
      error: new Error('spawnSync pnpm ETIMEDOUT'),
    };
    const { spawn } = fakeSpawn([killed]);
    const result = pushSchemaWithRetry(spawn, '/schema.prisma', 'DATABASE_URL', 'mysql://x', 600);
    expect(result.status).toBeNull();
    expect(result.stderr).toContain('ETIMEDOUT');
  });

  it('T-PSR-005 接続を受けていないことを表す別の言い回しも拾う', () => {
    // prisma は状況によって文面が変わる。 実測で観測した 3 通りを拾う。
    for (const stderr of [
      'Please make sure your database server is running at localhost:33562',
      'connect ECONNREFUSED 127.0.0.1:5432',
      "Can't reach database server at `localhost`:`33562`",
    ]) {
      const { spawn, calls } = fakeSpawn([{ status: 1, stderr, stdout: '' }, OK]);
      const result = pushSchemaWithRetry(spawn, '/schema.prisma', 'DATABASE_URL', 'mysql://x');
      expect(result.status, `再試行しなかった: ${stderr}`).toBe(0);
      expect(calls()).toBe(2);
    }
  });
});
