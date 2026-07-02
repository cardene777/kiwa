import type {
  QualityReport,
  ReleaseGateBlocker,
  ReleaseGateThresholds,
  ReleaseGateVerdict,
} from './types.js';

/**
 * Default release-gate thresholds. Chosen conservatively for the v1.11
 * milestone: coverage floors match the industry-standard "80% branch / 85%
 * line" bar, fidelity floor of 70% mirrors the ratio v1.10 provider dogfood
 * runs need to reach to be considered "acceptable"; the perf ceiling of
 * 100 ms is targeted at unit-scope adapters.
 */
export const DEFAULT_RELEASE_GATE_THRESHOLDS: ReleaseGateThresholds = {
  coverageLine: 85,
  coverageBranch: 80,
  coverageFunction: 90,
  fidelityRatio: 70,
  perfP95Ms: 100,
  mutationKillRate: 60,
  behaviorTests: 10,
};

/**
 * Evaluate a report against the release gate. Returns the verdict + a
 * complete list of blockers so callers can render actionable messages.
 *
 * The verdict is `passed = true` when every axis clears its threshold. A
 * partial pass (some axes clear, some fail) still returns `passed = false`
 * because release gate is all-or-nothing.
 */
export function evaluateReleaseGate(
  report: QualityReport,
  overrides: Partial<ReleaseGateThresholds> = {},
): ReleaseGateVerdict {
  const thresholds: ReleaseGateThresholds = {
    ...DEFAULT_RELEASE_GATE_THRESHOLDS,
    ...overrides,
  };
  const blockers: ReleaseGateBlocker[] = [];
  const check = (
    axis: string,
    actual: number,
    threshold: number,
    op: '>=' | '<=',
  ): void => {
    const ok = op === '>=' ? actual >= threshold : actual <= threshold;
    if (!ok) {
      blockers.push({ axis, threshold, actual, op });
    }
  };

  check('coverage.line', report.coverage.line, thresholds.coverageLine, '>=');
  check('coverage.branch', report.coverage.branch, thresholds.coverageBranch, '>=');
  check('coverage.function', report.coverage.function, thresholds.coverageFunction, '>=');
  check('fidelity.ratio', report.fidelity.ratio, thresholds.fidelityRatio, '>=');
  check('perf.p95Ms', report.perf.p95Ms, thresholds.perfP95Ms, '<=');
  check('mutation.killRate', report.mutation.killRate, thresholds.mutationKillRate, '>=');
  check('testCount.behavior', report.testCount.behavior, thresholds.behaviorTests, '>=');

  return {
    passed: blockers.length === 0,
    blockers,
    axesEvaluated: 7,
  };
}
