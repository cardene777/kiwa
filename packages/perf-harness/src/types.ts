import type {
  QualityReport,
  ReleaseGateBlocker,
  ReleaseGateVerdict,
} from '@kiwa-test/quality-metrics';

export interface MeasureInput {
  name: string;
  fn: () => void | Promise<void>;
  iterations: number;
  warmup?: number;
}

export interface MeasureResult {
  name: string;
  iterations: number;
  warmup: number;
  samples: number[];
  p50: number;
  p95: number;
  p99: number;
  mean: number;
  stdev: number;
  minMs: number;
  maxMs: number;
  totalMs: number;
}

export interface RegressionInput {
  current: MeasureResult;
  baseline: MeasureResult;
  threshold?: number;
  /**
   * Welch t-test critical value. v0.2 default 2、 v0.3 strict では 3。
   */
  tCritical?: number;
}

export interface RegressionResult {
  regressed: boolean;
  deltaPct: number;
  welchT: number;
  significant: boolean;
  verdict: 'improved' | 'stable' | 'regressed';
}

export interface Thresholds {
  p95Ms?: number;
  costUsd?: number;
  tokens?: number;
  accuracy?: number;
}

export interface PerfGateInput {
  result: MeasureResult;
  baseline?: MeasureResult | null;
  thresholds?: Thresholds;
  metrics?: {
    costUsd?: number;
    tokens?: number;
    accuracy?: number;
  };
}

export interface PerfGateResult {
  report: QualityReport;
  verdict: ReleaseGateVerdict;
  breaches: ReleaseGateBlocker[];
}
