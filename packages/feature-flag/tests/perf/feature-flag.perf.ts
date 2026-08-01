import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { baselinePathFor, resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import { createFlagClient, evaluateFlag, evaluateAllFlags } from '../../src/index.js';

const MODULE = 'feature-flag';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf', `${MODULE}.md`);
const BASELINE_PATH = baselinePathFor(REPO_ROOT, MODULE);

describe(MODULE, () => {
  it(
    '3-layer perf: evaluate + all + register primary paths',
    async () => {
      const client = createFlagClient({
        provider: 'growthbook',
        flags: [
          { key: 'new-checkout', variant: 'boolean', defaultValue: false },
          { key: 'plan-name', variant: 'string', defaultValue: 'free' },
          { key: 'discount', variant: 'number', defaultValue: 0 },
        ],
      });
      const user = { id: 'u-1', attributes: { plan: 'pro' } };

      const result = await runPerf3Layer({
        moduleName: MODULE,
        requireGc: true,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            name: 'evaluateFlag',
            serialP95CapMs: 5,
            fn: async () => {
              evaluateFlag(client, 'new-checkout', user);
            },
          },
          {
            name: 'evaluateAllFlags',
            serialP95CapMs: 5,
            fn: async () => {
              evaluateAllFlags(client, user);
            },
          },
          {
            name: 'registerRule',
            serialP95CapMs: 5,
            fn: async () => {
              client.registerRule('new-checkout', { type: 'targeting', userIds: ['u-2'], value: true });
            },
          },
        ],
      });

      for (const outcome of result.outcomes) {
        expect.soft(outcome.serialGatePassed, `${outcome.name} serial p95`).toBe(true);
        expect.soft(outcome.concurrentGatePassed, `${outcome.name} concurrent p95`).toBe(true);
        expect.soft(outcome.memoryGatePassed, `${outcome.name} memory arrayBuffers`).toBe(true);
      }
      expect(result.allPassed).toBe(true);
    },
    120_000,
  );

  it(
    'timing baseline: performance.now() 100 回連続で serial p95 < 1ms',
    () => {
      const N = 100;
      const samples: number[] = [];
      for (let i = 0; i < N; i += 1) {
        const s = performance.now();
        void performance.now();
        samples.push(performance.now() - s);
      }
      samples.sort((a, b) => a - b);
      const p95 = samples[Math.floor(samples.length * 0.95)] ?? 0;
      expect(p95).toBeLessThan(1);
    },
    30_000,
  );

  it(
    'allocation baseline: 小 object 100 回生成の max latency < 5ms',
    () => {
      const N = 100;
      let maxLatency = 0;
      for (let i = 0; i < N; i += 1) {
        const start = performance.now();
        const obj = { id: i, val: `v${i}`, ts: Date.now() };
        if (obj.id < 0) throw new Error('unreachable');
        const elapsed = performance.now() - start;
        if (elapsed > maxLatency) maxLatency = elapsed;
      }
      expect(maxLatency).toBeLessThan(5);
    },
    30_000,
  );
});
