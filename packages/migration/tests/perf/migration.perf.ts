import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import { createMigrationClient, runUp, diffSchema } from '../../src/index.js';

const MODULE = 'migration';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline', `${MODULE}.json`);

describe(MODULE, () => {
  it(
    '3-layer perf: runUp + diffSchema primary paths',
    async () => {
      const client = createMigrationClient({ provider: 'prisma' });
      const migration = { id: '001', name: 'init', up: 'CREATE TABLE u()', down: 'DROP TABLE u' };
      const prev = { tables: [{ name: 'u', columns: [{ name: 'id', type: 'int', nullable: false }] }] };
      const next = { tables: [{ name: 'u', columns: [{ name: 'id', type: 'int', nullable: false }, { name: 'name', type: 'text', nullable: true }] }] };

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            name: 'runUp',
            serialP95CapMs: 5,
            fn: async () => {
              const c = createMigrationClient({ provider: 'prisma' });
              runUp(c, migration);
            },
          },
          {
            name: 'diffSchema',
            serialP95CapMs: 5,
            fn: async () => {
              diffSchema(prev, next);
            },
          },
          {
            name: 'clientCreate',
            serialP95CapMs: 5,
            fn: async () => {
              createMigrationClient({ provider: 'drizzle' });
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
      expect(client.provider).toBe('prisma');
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
