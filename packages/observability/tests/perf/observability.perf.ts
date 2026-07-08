import {
  checkThresholds,
  collectRunHistory,
  detectFlaky,
  renderDashboard,
  type CoverageSummary,
  type TestRunRecord,
} from '../../src/index.js';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa/perf-harness';
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
});
