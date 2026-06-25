import type { RunHistory, TestRunRecord } from './types.js';

export interface CollectRunHistoryOptions {
  /** Existing history to extend */
  history?: RunHistory;
  /** New records to append */
  records: TestRunRecord[];
  /** Cap the number of retained records per testId (FIFO eviction) */
  maxPerTest?: number;
}

export function collectRunHistory(opts: CollectRunHistoryOptions): RunHistory {
  const existing = opts.history?.records ?? [];
  const combined = [...existing, ...opts.records];
  if (!opts.maxPerTest) {
    return { records: combined };
  }

  const byTest = new Map<string, TestRunRecord[]>();
  for (const rec of combined) {
    const arr = byTest.get(rec.testId) ?? [];
    arr.push(rec);
    byTest.set(rec.testId, arr);
  }

  const capped: TestRunRecord[] = [];
  for (const arr of byTest.values()) {
    const start = Math.max(0, arr.length - opts.maxPerTest);
    capped.push(...arr.slice(start));
  }
  capped.sort((a, b) => a.startedAt - b.startedAt);
  return { records: capped };
}

export interface VitestStyleAssertionResult {
  fullName?: string;
  title?: string;
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  duration?: number;
}

export interface VitestStyleTestResult {
  testFilePath?: string;
  assertionResults: VitestStyleAssertionResult[];
}

export interface VitestStyleReport {
  testResults: VitestStyleTestResult[];
  startTime?: number;
}

export interface FromVitestJsonOptions {
  runId: string;
}

const TC_ID_REGEX = /\bT-[A-Z0-9]+-\d+\b/;

export function fromVitestJson(report: VitestStyleReport, opts: FromVitestJsonOptions): TestRunRecord[] {
  const startedAt = report.startTime ?? 0;
  const out: TestRunRecord[] = [];
  for (const file of report.testResults) {
    for (const assertion of file.assertionResults) {
      const fullName = assertion.fullName ?? assertion.title ?? '';
      const match = fullName.match(TC_ID_REGEX);
      const testId = match ? match[0] : fullName;
      const status =
        assertion.status === 'passed'
          ? 'passed'
          : assertion.status === 'failed'
          ? 'failed'
          : 'skipped';
      out.push({
        testId,
        fullName,
        status,
        durationMs: assertion.duration ?? 0,
        runId: opts.runId,
        startedAt,
      });
    }
  }
  return out;
}
