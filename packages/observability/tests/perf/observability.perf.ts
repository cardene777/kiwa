import {
  checkThresholds,
  collectRunHistory,
  detectFlaky,
  renderDashboard,
  type CoverageSummary,
  type TestRunRecord,
} from '../../src/index.js';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MODULE = 'observability';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

function makeRecords(count: number): TestRunRecord[] {
  const out: TestRunRecord[] = [];
  const statuses = ['passed', 'failed', 'passed', 'passed'] as const;
  for (let i = 0; i < count; i += 1) {
    out.push({
      testId: `t${i % 20}`,
      fullName: `suite > test ${i % 20}`,
      status: statuses[i % statuses.length]!,
      startedAt: 1_700_000_000_000 + i * 1000,
      durationMs: 10 + (i % 20),
      runId: `run-${Math.floor(i / 20)}`,
    });
  }
  return out;
}

const RECORDS = makeRecords(200);
const HISTORY = { records: RECORDS };
const COVERAGE_SUMMARY: CoverageSummary = {
  total: {
    path: '',
    statements: { total: 100, covered: 92, skipped: 0, pct: 92 },
    branches: { total: 80, covered: 70, skipped: 0, pct: 87 },
    functions: { total: 50, covered: 48, skipped: 0, pct: 96 },
    lines: { total: 100, covered: 92, skipped: 0, pct: 92 },
  },
  files: [],
};

describe(MODULE, () => {
  it(
    '3-layer perf: history + flaky + threshold + dashboard primary paths',
    async () => {
      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            // collectRunHistory concats the incoming records and (when capped)
            // rebuilds the by-test map. 200-record run is a real workload.
            name: 'collectRunHistory',
            serialP95CapMs: 5,
            fn: () => {
              collectRunHistory({ records: RECORDS, maxPerTest: 10 });
            },
          },
          {
            // detectFlaky walks records once + a per-test aggregation pass.
            // O(N) in record count.
            name: 'detectFlaky',
            serialP95CapMs: 5,
            fn: () => {
              detectFlaky({ history: HISTORY });
            },
          },
          {
            // checkThresholds is a fixed 4-metric compare against the summary
            // total row. Pure numeric, no allocation.
            name: 'checkThresholds',
            serialP95CapMs: 5,
            fn: () => {
              checkThresholds(COVERAGE_SUMMARY, {
                statements: 80,
                branches: 70,
                functions: 80,
                lines: 80,
              });
            },
          },
          {
            // renderDashboard produces a fixed-size markdown string. String
            // concat + reduce over records.
            name: 'renderDashboard',
            serialP95CapMs: 5,
            fn: () => {
              renderDashboard({ history: HISTORY, flaky: [], gaps: [] });
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
    'timing baseline: performance.now() 100 回連続で serial p95 < 1ms (perf harness 環境 sanity)',
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
    'allocation baseline: 小 object 100 回生成の max latency < 5ms (V8 alloc floor)',
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
