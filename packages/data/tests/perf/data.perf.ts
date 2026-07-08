import { createFakeClock, setupQueueEnv } from '../../src/index.js';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MODULE = 'data';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: queue send + fake-clock advance primary paths',
    async () => {
      const env = await setupQueueEnv<{ id: number }>({ mode: 'mock' });
      const clock = createFakeClock({ startMs: 0 });
      clock.schedule(1000, () => {});
      clock.schedule(2500, () => {});

      let counter = 0;
      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            // In-memory queue send: dedup index lookup + push + notify
            // consumers. Mock-invariant floor.
            name: 'queueSend',
            serialP95CapMs: 5,
            fn: () => {
              env.client.send({ id: ++counter });
            },
          },
          {
            // Fake-clock advanceMs walks the entries[] array and fires due
            // callbacks. With 2 scheduled entries the walk is tight.
            name: 'fakeClockAdvance',
            serialP95CapMs: 5,
            fn: async () => {
              await clock.advanceMs(100);
            },
          },
        ],
      });

      await env.stop();
      for (const outcome of result.outcomes) {
        expect.soft(outcome.serialGatePassed, `${outcome.name} serial p95`).toBe(true);
        expect.soft(outcome.concurrentGatePassed, `${outcome.name} concurrent p95`).toBe(true);
        expect.soft(outcome.memoryGatePassed, `${outcome.name} memory arrayBuffers`).toBe(true);
      }
      expect(result.allPassed).toBe(true);
    },
    120_000,
  );
});
