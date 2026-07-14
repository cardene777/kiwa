/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { detectFlaky } from '../../src/index.js';

const MODULE = 'observability-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

function generateHistory(testCount: number, runCount: number) {
  const records: Array<{ testId: string; fullName: string; status: 'passed' | 'failed'; durationMs: number; runId: string; startedAt: number }> = [];
  for (let t = 0; t < testCount; t++) {
    for (let r = 0; r < runCount; r++) {
      records.push({
        testId: `test-${t}`,
        fullName: `suite.test-${t}`,
        status: (t + r) % 3 === 0 ? 'failed' : 'passed',
        durationMs: 10,
        runId: `run-${r}`,
        startedAt: Date.now(),
      });
    }
  }
  return { records };
}

describe('observability app scenario perf (real workload)', () => {
  it('3-layer perf: flaky detect burst / large history / threshold varying', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      reportPath: REPORT_PATH,
      serialIterations: 30,
      serialWarmup: 5,
      concurrency: 4,
      iterationsPerWorker: 8,
      memoryIterations: 30,
      ops: [
        {
          name: 'flaky_detect_burst (50 test × 10 run history detect)',
          fn: () => {
            const history = generateHistory(50, 10);
            detectFlaky({ history, minRuns: 3, threshold: 0.1 });
          },
          serialP95CapMs: 100,
        },
        {
          name: 'large_history_detect (200 test × 5 run)',
          fn: () => {
            const history = generateHistory(200, 5);
            detectFlaky({ history, minRuns: 3, threshold: 0.2 });
          },
          serialP95CapMs: 100,
        },
        {
          name: 'threshold_varying_workload (10 different threshold)',
          fn: () => {
            const history = generateHistory(30, 8);
            for (let i = 0; i < 10; i++) {
              detectFlaky({ history, minRuns: 3, threshold: 0.05 + i * 0.05 });
            }
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
