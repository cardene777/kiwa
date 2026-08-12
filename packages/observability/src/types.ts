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
  /**
   * spec から読めた case の件数。
   *
   * 2 つの id 配列だけでは「解析できた上で一致した」 と「1 件も解析できなかった」 が
   * 区別できない。 どちらも両方空になり、 dashboard は同じ文字列を出す (実測、 #1910)。
   * 件数は読み手が区別するための唯一の材料で、 0 件は gap が無いことではなく
   * 突き合わせが成立していないことを意味する。
   */
  specCaseCount: number;
}

export interface DashboardInput {
  history: RunHistory;
  flaky: FlakyTest[];
  gaps: SpecCoverageGap[];
  coverage?: import('./coverage.js').CoverageSummary;
  /**
   * `detectFlaky` に渡したのと同じ `minRuns`。
   *
   * 表示が「判定した上で無い」 と「判定していない」 を分けるのに要る。 省くと
   * `detectFlaky` と同じ既定 (`DEFAULT_FLAKY_MIN_RUNS`) を使う = 呼出側が既定の
   * ままなら渡さなくても一致する。 **別の値を渡した時は必ずここにも渡す**。
   */
  flakyMinRuns?: number;
}
