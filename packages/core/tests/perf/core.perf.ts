import { createPool, parseSpec } from '../../src/index.js';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MODULE = 'core';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

const SAMPLE_SPEC = `# Sample spec

- id: sample-001
- layer: unit
- mode: mock

| priority | id | observation | given | when | then |
|---|---|---|---|---|---|
| P1 | c1 | first  | initial state | trigger action | expect success |
| P1 | c2 | second | edge case     | trigger action | expect failure |
| P2 | c3 | third  | boundary      | trigger action | expect noop    |
`;

describe(MODULE, () => {
  it(
    '3-layer perf: parseSpec + createPool primary paths',
    async () => {
      const result = await runPerf3Layer({
        moduleName: MODULE,
        requireGc: true,
        reportPath: REPORT_PATH,
        ops: [
          {
            // parseSpec walks a 3-line meta block + 3-row table. Pure string
            // parsing, no I/O, targets the mock-invariant JS floor.
            name: 'parseSpec',
            serialP95CapMs: 5,
            fn: () => {
              parseSpec(SAMPLE_SPEC);
            },
          },
          {
            // createPool builds a size-4 pool where acquire() returns a fresh
            // object literal. Measures pool construction + Promise.all fan-out.
            name: 'createPool',
            serialP95CapMs: 5,
            fn: async () => {
              const pool = await createPool<{ id: number }>({
                size: 4,
                acquire: async () => ({ id: Math.random() }),
              });
              const lease = await pool.borrow();
              await lease.release();
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
    'micro-benchmark: parseSpec 単体高速 chk (serial p95 < 2ms)',
    () => {
      // 10 回連続実行して serial p95 を粗く測定、 3-layer perf harness の重厚経路と別に
      // 「単発 op が想定 latency 内」 の smoke chk として補完する。
      const N = 10;
      const samples: number[] = [];
      for (let i = 0; i < N; i += 1) {
        const start = performance.now();
        parseSpec(SAMPLE_SPEC);
        samples.push(performance.now() - start);
      }
      samples.sort((a, b) => a - b);
      const p95 = samples[Math.floor(samples.length * 0.95)] ?? 0;
      expect(p95).toBeLessThan(2);
    },
    30_000,
  );

  it(
    'micro-benchmark: createPool + borrow/release round-trip (serial p95 < 10ms)',
    async () => {
      const N = 10;
      const samples: number[] = [];
      for (let i = 0; i < N; i += 1) {
        const start = performance.now();
        const pool = await createPool<{ id: number }>({
          size: 2,
          acquire: async () => ({ id: i }),
        });
        const lease = await pool.borrow();
        await lease.release();
        samples.push(performance.now() - start);
      }
      samples.sort((a, b) => a - b);
      const p95 = samples[Math.floor(samples.length * 0.95)] ?? 0;
      expect(p95).toBeLessThan(10);
    },
    30_000,
  );

  it(
    'stability: parseSpec を 100 回連続実行して安定応答時間 (max < 20ms)',
    () => {
      // 高負荷連続実行下で max latency が exponential blow up しない安定性 chk。
      const N = 100;
      let maxLatency = 0;
      for (let i = 0; i < N; i += 1) {
        const start = performance.now();
        parseSpec(SAMPLE_SPEC);
        const elapsed = performance.now() - start;
        if (elapsed > maxLatency) maxLatency = elapsed;
      }
      expect(maxLatency).toBeLessThan(20);
    },
    30_000,
  );
});
