import type { FlakyTest, RunHistory } from './types.js';

export interface DetectFlakyOptions {
  history: RunHistory;
  /** Minimum number of runs before a test is eligible for flaky scoring */
  minRuns?: number;
  /** Failure rate threshold; tests with 0 < rate < 1 are flaky; tests above this are reported */
  threshold?: number;
}

export function detectFlaky(opts: DetectFlakyOptions): FlakyTest[] {
  const minRuns = opts.minRuns ?? 3;
  const threshold = opts.threshold ?? 0.1;
  const byId = new Map<string, { fullName: string; passes: number; failures: number; totalRuns: number }>();
  for (const rec of opts.history.records) {
    if (rec.status === 'skipped') continue;
    const entry = byId.get(rec.testId) ?? {
      fullName: rec.fullName,
      passes: 0,
      failures: 0,
      totalRuns: 0,
    };
    entry.totalRuns += 1;
    if (rec.status === 'passed') entry.passes += 1;
    if (rec.status === 'failed') entry.failures += 1;
    byId.set(rec.testId, entry);
  }
  const out: FlakyTest[] = [];
  for (const [testId, entry] of byId) {
    if (entry.totalRuns < minRuns) continue;
    if (entry.passes === entry.totalRuns) continue;
    if (entry.failures === entry.totalRuns) continue;
    const failureRate = entry.failures / entry.totalRuns;
    if (failureRate < threshold) continue;
    out.push({
      testId,
      fullName: entry.fullName,
      totalRuns: entry.totalRuns,
      passes: entry.passes,
      failures: entry.failures,
      failureRate,
    });
  }
  out.sort((a, b) => b.failureRate - a.failureRate);
  return out;
}
