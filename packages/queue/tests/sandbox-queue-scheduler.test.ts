import { afterEach, describe, expect, it, vi } from 'vitest';
import { setupBullMQEnv, type BullMQTestEnv, type QueueJobSnapshot } from '../src/index.js';

/**
 * sandbox queue の scheduler / job 同一性 / timer 契約を検証する test。
 *
 * 既存 test は `assert*` helper の失敗経路を中心に見ており、
 * 「どの job が / どの順に / いつ動いたか」 と「timer をどう張ったか」 を観測していなかった。
 * 変異試験ではこの範囲に 57 件が生き残っていた。
 *
 * observation point は 3 つ。
 *
 * | 観測点 | 何が読めるか |
 * |---|---|
 * | `listJobs()` の snapshot | state 遷移 / job id / key の有無 |
 * | processor が呼ばれた順序 | scheduler の並べ替え |
 * | `setTimeout` の引数と `unref` 呼出 | tick 間隔 / 二重予約 / event loop を掴まない契約 |
 */

const envs: BullMQTestEnv[] = [];

type TimerCall = { delay: unknown; unrefCalled: boolean };

/**
 * `setTimeout` を包んで、渡された遅延と `unref` の呼出を記録する。
 *
 * 実 timer はそのまま張るので待ち時間の意味は変わらない。 sandbox は
 * 「timer は必ず unref する = vitest の終了を妨げない」 を doc comment で明示しており、
 * その契約は timer object を見ないと観測できない。
 */
function recordTimers(): TimerCall[] {
  const calls: TimerCall[] = [];
  const real = globalThis.setTimeout;
  vi.stubGlobal('setTimeout', ((handler: never, delay?: never, ...rest: never[]) => {
    const record: TimerCall = { delay, unrefCalled: false };
    calls.push(record);
    const timer = real(handler, delay, ...rest) as unknown as {
      unref?: () => unknown;
    };
    const realUnref = timer.unref?.bind(timer);
    timer.unref = () => {
      record.unrefCalled = true;
      return realUnref ? realUnref() : timer;
    };
    return timer as never;
  }) as never);
  return calls;
}

/**
 * `unref` を持たない timer を返す `setTimeout` に差し替える。
 *
 * Node は `unref` を持つ Timeout object を返すが、それは実装の都合であって
 * `setTimeout` の契約ではない (browser は数値を返す)。 sandbox は `unref?.()` の形で
 * 呼んでおり、その `?.` が無いと `unref` を持たない実装で落ちる。
 *
 * `typeof timer === 'object'` の判定を通る形にしたいので、数値ではなく
 * **`unref` を持たない object** を返す。 数値だと scheduler 側の型判定で弾かれ、
 * `unref?.()` の行に到達しない。
 */
function useUnrefLessTimers(): void {
  const real = globalThis.setTimeout;
  const realClear = globalThis.clearTimeout;
  vi.stubGlobal('setTimeout', ((handler: never, delay?: never, ...rest: never[]) => {
    return { inner: real(handler, delay, ...rest) } as never;
  }) as never);
  vi.stubGlobal('clearTimeout', ((handle: never) => {
    const inner = (handle as unknown as { inner?: unknown } | undefined)?.inner;
    if (inner) realClear(inner as never);
  }) as never);
}

/** 実時間を待つ (stub した setTimeout を経由しない)。 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = globalThis.setTimeout(resolve, ms);
    (timer as unknown as { unref?: () => void }).unref?.();
  });
}

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
  vi.unstubAllGlobals();
});

async function sandbox(
  opts: Parameters<typeof setupBullMQEnv>[0] = {},
): Promise<BullMQTestEnv> {
  const env = await setupBullMQEnv(opts);
  envs.push(env);
  return env;
}

describe('sandbox queue — job の同一性と順序', () => {
  it('T-QUEUE-SB-001 jobId 未指定なら 1 から昇順で採番する', async () => {
    const env = await sandbox();
    await env.addJob('first', { n: 1 });
    await env.addJob('second', { n: 2 });
    expect(env.listJobs().map((job) => job.id)).toStrictEqual(['1', '2']);
  });

  it('T-QUEUE-SB-002 jobId を渡すとそれが使われ、採番も進む', async () => {
    const env = await sandbox();
    await env.addJob('named', { n: 1 }, { jobId: 'custom' });
    await env.addJob('auto', { n: 2 });
    expect(env.listJobs().map((job) => job.id)).toStrictEqual(['custom', '2']);
  });

  it('T-QUEUE-SB-003 同じ tick で動ける job は id の昇順で処理する', async () => {
    const env = await sandbox();
    const order: string[] = [];
    // processor 登録前に投入することで、2 件が同じ tick の runnable に載る。
    await env.addJob('job', { tag: 'b' }, { jobId: 'b' });
    await env.addJob('job', { tag: 'a' }, { jobId: 'a' });
    env.process(async (snap) => {
      order.push((snap.data as { tag: string }).tag);
      return null;
    });
    await env.assertQueueDrained();
    // 投入順は b → a。 id 昇順に並べ替えるので処理順は a → b になる。
    expect(order).toStrictEqual(['a', 'b']);
  });

  it('T-QUEUE-SB-004 waitForJob は名前が一致する job を返す', async () => {
    const env = await sandbox();
    env.process(async (snap) => (snap.data as { tag: string }).tag);
    await env.addJob('alpha', { tag: 'A' }, { jobId: '1' });
    await env.addJob('beta', { tag: 'B' }, { jobId: '2' });
    const snap = await env.waitForJob('beta');
    expect({ name: snap.name, id: snap.id, returnValue: snap.returnValue }).toStrictEqual({
      name: 'beta',
      id: '2',
      returnValue: 'B',
    });
  });
});

describe('sandbox queue — state の遷移が外から見える', () => {
  it('T-QUEUE-SB-101 処理中の job は active として観測できる', async () => {
    const env = await sandbox();
    let observed: QueueJobSnapshot[] = [];
    env.process(async () => {
      // 自分自身が処理中の間に一覧を見る。
      observed = env.listJobs();
      return 'done';
    });
    await env.addJob('inflight', {});
    await env.assertProcessed('inflight');
    expect(observed.map((job) => job.state)).toStrictEqual(['active']);
  });

  it('T-QUEUE-SB-102 delay 付きの job は delayed から始まる', async () => {
    const env = await sandbox();
    await env.addJob('later', {}, { delay: 60 });
    expect(env.listJobs().map((job) => job.state)).toStrictEqual(['delayed']);
  });

  it('T-QUEUE-SB-103 delay が明けるまで processor は呼ばれない', async () => {
    const env = await sandbox();
    const seen: number[] = [];
    env.process(async () => {
      seen.push(Date.now());
      return null;
    });
    await env.addJob('later', {}, { delay: 80 });
    await sleep(30);
    expect(seen, 'delay 前に処理されている').toStrictEqual([]);
    await env.assertProcessed('later');
    expect(seen).toHaveLength(1);
  });

  it('T-QUEUE-SB-104 delay 0 の job は最初から waiting で、遅延せずに処理される', async () => {
    const env = await sandbox();
    await env.addJob('now', {}, { delay: 0 });
    expect(env.listJobs().map((job) => job.state)).toStrictEqual(['waiting']);
    env.process(async () => 'ok');
    await env.assertProcessed('now');
  });

  it('T-QUEUE-SB-105 stop 後に delay が明けても job は復活しない', async () => {
    const env = await setupBullMQEnv();
    await env.addJob('later', {}, { delay: 40 });
    await env.stop();
    await sleep(90);
    // delay の timer が発火しても、消えた job を触ろうとして落ちてはいけない。
    expect(env.listJobs()).toStrictEqual([]);
  });
});

describe('sandbox queue — snapshot の形', () => {
  it('T-QUEUE-SB-201 未処理の job の snapshot に returnValue / failedReason の key は無い', async () => {
    const env = await sandbox();
    await env.addJob('pending', { n: 1 }, { jobId: 'p1', attempts: 2 });
    expect(env.listJobs()).toStrictEqual([
      { id: 'p1', name: 'pending', data: { n: 1 }, state: 'waiting', attemptsMade: 0 },
    ]);
  });

  it('T-QUEUE-SB-202 完了した job には returnValue が載り、failedReason は載らない', async () => {
    const env = await sandbox();
    env.process(async () => ({ ok: true }));
    await env.addJob('done', {}, { jobId: 'd1' });
    await env.assertProcessed('done');
    expect(env.listJobs()).toStrictEqual([
      {
        id: 'd1',
        name: 'done',
        data: {},
        state: 'completed',
        attemptsMade: 1,
        returnValue: { ok: true },
      },
    ]);
  });

  it('T-QUEUE-SB-203 失敗した job には failedReason が載り、returnValue は載らない', async () => {
    const env = await sandbox();
    env.process(async () => {
      throw new Error('boom');
    });
    await env.addJob('bad', {}, { jobId: 'b1' });
    await env.assertFailed('bad');
    expect(env.listJobs()).toStrictEqual([
      {
        id: 'b1',
        name: 'bad',
        data: {},
        state: 'failed',
        attemptsMade: 1,
        failedReason: 'boom',
      },
    ]);
  });
});

describe('sandbox queue — 失敗理由が message に出る', () => {
  it('T-QUEUE-SB-301 assertProcessed の失敗 message に実際の理由が入る', async () => {
    const env = await sandbox();
    env.process(async () => {
      throw new Error('disk full');
    });
    await env.addJob('bad', {});
    await expect(env.assertProcessed('bad')).rejects.toThrow(
      'assertProcessed: expected job "bad" to complete, got state=failed reason=disk full',
    );
  });

  it('T-QUEUE-SB-302 assertFailed の reasonMatch 不一致 message に実際の理由が入る', async () => {
    const env = await sandbox();
    env.process(async () => {
      throw new Error('disk full');
    });
    await env.addJob('bad', {});
    await expect(env.assertFailed('bad', { reasonMatch: /network/ })).rejects.toThrow(
      'assertFailed: failedReason "disk full" did not match /network/',
    );
  });
});

describe('sandbox queue — timer の張り方', () => {
  it('T-QUEUE-SB-401 tick は設定した pollIntervalMs で予約し、timer を unref する', async () => {
    const calls = recordTimers();
    const env = await sandbox({ sandbox: { pollIntervalMs: 7 } });
    env.process(async () => 'ok');
    const tick = calls.find((call) => call.delay === 7);
    expect(tick, 'pollIntervalMs 7 で張られた timer が無い').toBeDefined();
    await env.addJob('x', {});
    await env.assertProcessed('x');
    expect(calls.filter((call) => call.delay === 7).every((call) => call.unrefCalled)).toBe(true);
  });

  it('T-QUEUE-SB-402 pollIntervalMs 未指定なら 1 を使う', async () => {
    const calls = recordTimers();
    const env = await sandbox();
    env.process(async () => 'ok');
    expect(calls.some((call) => call.delay === 1), '既定の 1ms で張られた timer が無い').toBe(true);
    expect(calls.some((call) => call.delay === undefined), 'delay 未指定の timer が張られている').toBe(
      false,
    );
  });

  it('T-QUEUE-SB-403 tick が生きている間は重ねて予約しない', async () => {
    const calls = recordTimers();
    const env = await sandbox({ sandbox: { pollIntervalMs: 40 } });
    // processor 登録で 1 本張る。 その直後の addJob は同じ timer を再利用する。
    env.process(async () => 'ok');
    const afterProcess = calls.filter((call) => call.delay === 40).length;
    expect(afterProcess, 'process() で tick が張られていない').toBe(1);
    await env.addJob('a', {});
    await env.addJob('b', {});
    expect(calls.filter((call) => call.delay === 40).length).toBe(afterProcess);
    await env.assertProcessed('a');
    await env.assertProcessed('b');
  });

  it('T-QUEUE-SB-404 delay 0 の job は遅延用の timer を張らない', async () => {
    const calls = recordTimers();
    const env = await sandbox({ sandbox: { pollIntervalMs: 40 } });
    await env.addJob('now', {}, { delay: 0 });
    expect(calls.some((call) => call.delay === 0), 'delay 0 で余計な timer を張っている').toBe(false);
    await env.addJob('later', {}, { delay: 25 });
    expect(calls.some((call) => call.delay === 25), 'delay 25 の timer が張られていない').toBe(true);
  });
});

describe('sandbox queue — 未処理判定', () => {
  it('T-QUEUE-SB-501 delayed の job が残っていれば drained にならない', async () => {
    const env = await sandbox();
    // processor を登録しないので、delay が明けても waiting のまま残る。
    await env.addJob('later', {}, { delay: 40 });
    await expect(env.assertQueueDrained()).rejects.toThrow(/still has waiting \/ active jobs/);
  });

  it('T-QUEUE-SB-502 active の job が残っていれば drained にならない', async () => {
    const env = await sandbox();
    env.process(async () => {
      await sleep(400);
      return 'ok';
    });
    await env.addJob('slow', {});
    await expect(env.assertQueueDrained()).rejects.toThrow(/still has waiting \/ active jobs/);
  });

  it('T-QUEUE-SB-503 すべて終わっていれば drained として返る', async () => {
    const env = await sandbox();
    env.process(async () => 'ok');
    await env.addJob('quick', {});
    await env.assertProcessed('quick');
    await expect(env.assertQueueDrained()).resolves.toBeUndefined();
  });
});

describe('sandbox queue — 再試行', () => {
  it('T-QUEUE-SB-601 attempts に達するまで waiting に戻して再実行する', async () => {
    const env = await sandbox();
    const states: string[] = [];
    let calls = 0;
    env.process(async () => {
      calls += 1;
      states.push(env.listJobs()[0]?.state ?? 'missing');
      if (calls < 3) throw new Error(`attempt ${calls}`);
      return 'ok';
    });
    await env.addJob('retry', {}, { jobId: 'r1', attempts: 3 });
    const snap = await env.assertProcessed('retry');
    expect(calls).toBe(3);
    expect(snap.attemptsMade).toBe(3);
    // 実行のたびに active になっている = 再実行が状態を経由している。
    expect(states).toStrictEqual(['active', 'active', 'active']);
    expect(env.listJobs()[0]?.failedReason).toBeUndefined();
  });

  it('T-QUEUE-SB-602 attempts を使い切ると最後の理由を残して failed になる', async () => {
    const env = await sandbox();
    let calls = 0;
    env.process(async () => {
      calls += 1;
      throw new Error(`attempt ${calls}`);
    });
    await env.addJob('doomed', {}, { attempts: 2 });
    const snap = await env.assertFailed('doomed', { retry: 2 });
    expect(calls).toBe(2);
    expect(snap.failedReason).toBe('attempt 2');
  });
});

describe('sandbox queue — timer 実装に依存しない', () => {
  it('T-QUEUE-SB-405 unref を持たない timer を返す実装でも一連の流れが通る', async () => {
    useUnrefLessTimers();
    const env = await setupBullMQEnv({ sandbox: { pollIntervalMs: 1 } });
    envs.push(env);
    env.process(async () => 'ok');
    // scheduler tick / delay 待ち / waitForJob の 3 経路が timer を張る。
    await env.addJob('now', {});
    await env.addJob('later', {}, { delay: 20 });
    await env.assertProcessed('now');
    await env.assertProcessed('later');
    await expect(env.assertQueueDrained()).resolves.toBeUndefined();
  });

  it('T-QUEUE-SB-405b unref を持たない timer でも drain 待ちの打ち切りまで到達する', async () => {
    useUnrefLessTimers();
    const env = await setupBullMQEnv({ sandbox: { pollIntervalMs: 200 } });
    envs.push(env);
    // processor を登録しないので waiting のまま残り、assertQueueDrained が待ち timer を張る。
    await env.addJob('stuck', {});
    await expect(env.assertQueueDrained()).rejects.toThrow(/still has waiting \/ active jobs/);
  });

  it('T-QUEUE-SB-410 job が無ければ tick は 1 本張って止まる', async () => {
    const calls = recordTimers();
    const env = await sandbox({ sandbox: { pollIntervalMs: 20 } });
    // processor の登録だけで tick が 1 本張られる。 job が無いので張り直さない。
    env.process(async () => 'ok');
    await sleep(150);
    expect(calls.filter((call) => call.delay === 20).length).toBe(1);
  });

  it('T-QUEUE-SB-411 job を処理し切った後も tick を張り直さない', async () => {
    const calls = recordTimers();
    const env = await sandbox({ sandbox: { pollIntervalMs: 20 } });
    env.process(async () => 'ok');
    await env.addJob('one', {});
    await env.assertProcessed('one');
    expect(calls.filter((call) => call.delay === 20).length).toBe(1);
    await sleep(150);
    expect(calls.filter((call) => call.delay === 20).length).toBe(1);
  });

  it('T-QUEUE-SB-406 stop は張ってある tick timer を片付ける', async () => {
    const cleared: unknown[] = [];
    const realClear = globalThis.clearTimeout;
    vi.stubGlobal('clearTimeout', ((id: never) => {
      cleared.push(id);
      return realClear(id as never);
    }) as never);
    const env = await setupBullMQEnv({ sandbox: { pollIntervalMs: 200 } });
    // processor 登録で tick timer が張られる。 job を入れないので発火前に stop まで到達する。
    env.process(async () => 'ok');
    await env.stop();
    expect(cleared.filter((id) => id !== undefined && id !== null).length).toBeGreaterThan(0);
  });

  it('T-QUEUE-SB-407 waitForJob の待ち間隔は pollIntervalMs の 5 倍と 10ms の小さい方', async () => {
    const calls = recordTimers();
    const env = await sandbox({ sandbox: { pollIntervalMs: 1 } });
    // 完了までに数 tick かかる job を置き、waitForJob に待ちを発生させる。
    env.process(async () => {
      await sleep(40);
      return 'ok';
    });
    await env.addJob('slow', {});
    await env.waitForJob('slow');
    const waits = calls.filter((call) => call.delay === 5);
    expect(waits.length, 'pollIntervalMs 1 に対する待ち timer (5ms) が無い').toBeGreaterThan(0);
    expect(calls.some((call) => call.delay === 10), '10ms 側に倒れている').toBe(false);
    expect(waits.every((call) => call.unrefCalled)).toBe(true);
  });

  it('T-QUEUE-SB-408 assertQueueDrained は 5ms 待ちをちょうど 50 回で打ち切る', async () => {
    const calls = recordTimers();
    const env = await sandbox({ sandbox: { pollIntervalMs: 200 } });
    // processor を登録しないので waiting のまま残り、待ち切って throw する。
    await env.addJob('stuck', {});
    await expect(env.assertQueueDrained()).rejects.toThrow(/still has waiting \/ active jobs/);
    expect(calls.filter((call) => call.delay === 5).length).toBe(50);
  });

  it('T-QUEUE-SB-409 queue が空になったら tick を張り続けない', async () => {
    const calls = recordTimers();
    const env = await sandbox({ sandbox: { pollIntervalMs: 20 } });
    env.process(async () => 'ok');
    await env.addJob('one', {});
    await env.assertProcessed('one');
    await env.assertQueueDrained();
    const settled = calls.filter((call) => call.delay === 20).length;
    await sleep(120);
    expect(calls.filter((call) => call.delay === 20).length).toBe(settled);
  });
});

describe('sandbox queue — 終わった job を掘り返さない', () => {
  it('T-QUEUE-SB-701 完了した job は後続の tick で再実行されない', async () => {
    const env = await sandbox({ sandbox: { pollIntervalMs: 5 } });
    const runs: string[] = [];
    env.process(async (snap) => {
      runs.push(snap.name);
      return 'ok';
    });
    await env.addJob('quick', {}, { jobId: 'a' });
    await env.assertProcessed('quick');
    // 遅延 job が残っている間 tick は回り続ける。 その間に完了済 job が再実行されないこと。
    await env.addJob('later', {}, { jobId: 'b', delay: 90 });
    await env.assertProcessed('later');
    expect(runs).toStrictEqual(['quick', 'later']);
    expect(env.listJobs().map((job) => [job.id, job.attemptsMade])).toStrictEqual([
      ['a', 1],
      ['b', 1],
    ]);
  });

  it('T-QUEUE-SB-702 失敗して打ち切った job も後続の tick で再実行されない', async () => {
    const env = await sandbox({ sandbox: { pollIntervalMs: 5 } });
    let calls = 0;
    env.process(async (snap) => {
      calls += 1;
      if (snap.name === 'bad') throw new Error('nope');
      return 'ok';
    });
    await env.addJob('bad', {}, { jobId: 'a' });
    await env.assertFailed('bad');
    const afterFail = calls;
    await env.addJob('later', {}, { jobId: 'b', delay: 90 });
    await env.assertProcessed('later');
    expect(calls).toBe(afterFail + 1);
    expect(env.listJobs().map((job) => [job.id, job.attemptsMade])).toStrictEqual([
      ['a', 1],
      ['b', 1],
    ]);
  });
});
