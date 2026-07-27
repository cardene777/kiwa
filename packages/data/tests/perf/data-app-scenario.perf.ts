/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { setupQueueEnv, createFakeClock } from '../../src/index.js';

const MODULE = 'data-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('data app scenario perf (real workload)', () => {
  it('3-layer perf: queue burst / cron scheduling / integrated workflow', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      requireGc: true,
      reportPath: REPORT_PATH,
      serialIterations: 30,
      serialWarmup: 5,
      concurrency: 4,
      iterationsPerWorker: 8,
      memoryIterations: 30,
      ops: [
        {
          name: 'queue_burst (setup + 50 send + 50 receive)',
          fn: async () => {
            const env = await setupQueueEnv<string>({ mode: 'mock' });
            for (let i = 0; i < 50; i++) env.client.send(`msg-${i}`);
            for (let i = 0; i < 50; i++) env.client.receive();
            await env.stop();
          },
          serialP95CapMs: 50,
        },
        {
          name: 'cron_scheduling (10 schedule + advanceMs 5 turn)',
          fn: async () => {
            const clock = createFakeClock({ startMs: 0 });
            let count = 0;
            for (let i = 0; i < 10; i++) clock.schedule(100, () => { count += 1; });
            for (let i = 0; i < 5; i++) await clock.advanceMs(500);
            if (count === 0) throw new Error('cron did not fire');
          },
          serialP95CapMs: 50,
        },
        {
          name: 'integrated_workflow (queue + clock combined)',
          fn: async () => {
            const env = await setupQueueEnv<number>({ mode: 'mock' });
            const clock = createFakeClock({ startMs: 0 });
            clock.schedule(50, () => env.client.send(1));
            await clock.advanceMs(500);
            const size = env.client.size();
            if (size === 0) throw new Error('integrated workflow silent');
            await env.stop();
          },
          serialP95CapMs: 50,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
