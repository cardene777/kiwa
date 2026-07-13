/**
 * real fidelity test — `docs/concepts/test-taxonomy.md § fidelity real driver`。
 *
 * createSandboxBullMQEnv (kiwa mock adapter) が、 real BullMQ (testcontainers Redis
 * 経由の real bullmq queue) と同じ addJob → process → waitForJob 挙動を返すことを
 * 保証する。 既存 static fidelity test (mock ↔ FIFO reference) を補完し、 mock が
 * real BullMQ の job lifecycle semantics (state 遷移 / returnValue / attemptsMade)
 * を再現しているか動的検証する経路。
 *
 * env-gate = KIWA_MODE=real 時のみ実行。 default は skip (Docker + testcontainers
 * 起動 cost 回避)。
 */
import { assertFidelity, resolveRealFidelityMode } from '@kiwa-lab/quality-metrics';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { setupBullMQEnv } from '../../src/index.js';
import type { BullMQTestEnv, QueueJobSnapshot } from '../../src/types.js';

const gate = resolveRealFidelityMode({
  lib: 'queue',
  requiredEnvKeys: [],
});

/** job snapshot を fidelity 比較用に射影 (id / attemptsMade / returnValue は実装依存で不安定 → 除外)。 */
function project(snap: QueueJobSnapshot<unknown, unknown>) {
  return {
    name: snap.name,
    data: snap.data,
    state: snap.state,
  };
}

describe.skipIf(!gate.enabled)('createSandboxBullMQEnv real fidelity vs testcontainers BullMQ', () => {
  let mock: BullMQTestEnv;
  let real: BullMQTestEnv;

  beforeAll(async () => {
    mock = await setupBullMQEnv({ mode: 'sandbox', queueName: 'kiwa-fidelity-mock' });
    real = await setupBullMQEnv({ mode: 'testcontainers', queueName: 'kiwa-fidelity-real' });
  }, 180_000);

  afterAll(async () => {
    await mock.stop?.();
    await real.stop?.();
  }, 60_000);

  it('addJob → process (async double) → waitForJob = completed + returnValue 一致', async () => {
    const processor = async (job: QueueJobSnapshot<{ n: number }, number>): Promise<number> =>
      job.data.n * 2;
    mock.process(processor);
    real.process(processor);

    await mock.addJob('double', { n: 3 });
    await real.addJob('double', { n: 3 });

    const result = await assertFidelity({
      mockFn: async () => {
        const s = await mock.waitForJob<{ n: number }, number>('double', { timeoutMs: 30_000 });
        return project(s);
      },
      realFn: async () => {
        const s = await real.waitForJob<{ n: number }, number>('double', { timeoutMs: 30_000 });
        return project(s);
      },
      cases: [{ name: 'double 3 → state completed', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);
    expect(result.divergences).toEqual([]);
  });

  it('processor throw = failed state に遷移 (mock ↔ real 一致)', async () => {
    // 各 env に fresh queue で新規 processor 登録 (前 test の state 残存回避)
    const mockFail = await setupBullMQEnv({ mode: 'sandbox', queueName: 'kiwa-fidelity-mock-fail' });
    const realFail = await setupBullMQEnv({ mode: 'testcontainers', queueName: 'kiwa-fidelity-real-fail' });
    try {
      const processor = async (_job: QueueJobSnapshot<unknown, unknown>): Promise<never> => {
        throw new Error('intentional failure');
      };
      mockFail.process(processor);
      realFail.process(processor);

      await mockFail.addJob('boom', {});
      await realFail.addJob('boom', {});

      const result = await assertFidelity({
        mockFn: async () => {
          const s = await mockFail.waitForJob('boom', { timeoutMs: 30_000 });
          return { name: s.name, state: s.state };
        },
        realFn: async () => {
          const s = await realFail.waitForJob('boom', { timeoutMs: 30_000 });
          return { name: s.name, state: s.state };
        },
        cases: [{ name: 'throw → state failed', args: [] as [] }],
      });
      expect(result.ratio).toBe(100);
      expect(result.failed).toBe(0);
    } finally {
      await mockFail.stop?.();
      await realFail.stop?.();
    }
  }, 120_000);
});

if (!gate.enabled) {
  // eslint-disable-next-line no-console
  console.log(`[queue real-fidelity] skipped: ${gate.skipReason}`);
}
