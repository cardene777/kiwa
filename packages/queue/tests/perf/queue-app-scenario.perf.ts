/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createSandboxBullMQEnv } from '../../src/index.js';

const MODULE = 'queue-app-scenario';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

/**
 * queue 実 app scenario perf test = 実 job queue 使用 pattern を再現。
 * dogfood-queue-* project の実 workload に対応、 producer burst / consumer processing /
 * retry cycle / drain flow の 3 scenario で end-to-end timing 測定。
 */
describe('queue app scenario perf (real workload)', () => {
  it('3-layer perf: producer burst / consumer processing / drain flow', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      requireGc: true,
      reportPath: REPORT_PATH,
      serialIterations: 95,
      serialWarmup: 10,
      concurrency: 4,
      iterationsPerWorker: 5,
      memoryIterations: 20,
      ops: [
        {
          name: 'producer_burst (20 addJob + process + drain)',
          fn: async () => {
            const env = createSandboxBullMQEnv({ mode: 'sandbox', queueName: `q-${Math.random()}` });
            env.process(async () => 'ok');
            for (let i = 0; i < 20; i++) await env.addJob(`t-${i}`, { i });
            await env.waitForJob('t-19', { timeoutMs: 5000 });
            await env.assertQueueDrained();
            await env.stop();
          },
          serialP95CapMs: 200,
        },
        {
          name: 'consumer_processing_with_return (5 addJob + assertProcessed)',
          fn: async () => {
            const env = createSandboxBullMQEnv({ mode: 'sandbox', queueName: `q-${Math.random()}` });
            env.process(async (job) => `processed:${(job.data as { i: number }).i}`);
            for (let i = 0; i < 5; i++) {
              await env.addJob(`task-${i}`, { i });
              await env.assertProcessed(`task-${i}`, { returnValue: `processed:${i}` });
            }
            await env.stop();
          },
          serialP95CapMs: 200,
        },
        {
          name: 'error_retry_cycle (fail 3 job + assertFailed)',
          fn: async () => {
            const env = createSandboxBullMQEnv({ mode: 'sandbox', queueName: `q-${Math.random()}` });
            env.process(async () => {
              throw new Error('retry test');
            });
            for (let i = 0; i < 3; i++) {
              await env.addJob(`fail-${i}`, {});
              await env.assertFailed(`fail-${i}`, { reasonMatch: /retry test/ });
            }
            await env.stop();
          },
          serialP95CapMs: 200,
        },
      ],
    });
    expect(result.allPassed).toBe(true);
  });
});
