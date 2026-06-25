export type TestStatus = 'passed' | 'failed' | 'skipped';

export interface TestRunRecord {
  testId: string;
  fullName: string;
  status: TestStatus;
  durationMs: number;
  runId: string;
  startedAt: number;
}

export interface RunHistory {
  records: TestRunRecord[];
}

export interface FlakyTest {
  testId: string;
  fullName: string;
  totalRuns: number;
  passes: number;
  failures: number;
  failureRate: number;
}

export interface SpecCoverageGap {
  module: string;
  layer: string;
  missingTcIds: string[];
  extraTcIds: string[];
}

export interface DashboardInput {
  history: RunHistory;
  flaky: FlakyTest[];
  gaps: SpecCoverageGap[];
  coverage?: import('./coverage.js').CoverageSummary;
}
