import {
  evaluateReleaseGate,
  type QualityReport,
  type ReleaseGateBlocker,
  type ReleaseGateVerdict,
} from '@kiwa-test/quality-metrics';
import type {
  PerfGateInput,
  PerfGateResult,
  Thresholds,
} from './types.js';

export function evaluatePerfGate(input: PerfGateInput): PerfGateResult {
  const thresholds = input.thresholds ?? {};
  const enabledAxes = countThresholds(thresholds);
  const report = buildReport(input, thresholds, enabledAxes === 0);
  const relaxedVerdict = evaluateReleaseGate(report, {
    coverageLine: 0,
    coverageBranch: 0,
    coverageFunction: 0,
    fidelityRatio: 0,
    perfP95Ms: thresholds.p95Ms ?? Number.POSITIVE_INFINITY,
    mutationKillRate: 0,
    behaviorTests: 0,
  });

  if (enabledAxes === 0) {
    return {
      report,
      verdict: { passed: true, blockers: [], axesEvaluated: 0 },
      breaches: [],
    };
  }

  const breaches: ReleaseGateBlocker[] = [];
  if (thresholds.p95Ms !== undefined && relaxedVerdict.blockers.some((blocker) => blocker.axis === 'perf.p95Ms')) {
    breaches.push({
      axis: 'perf.p95Ms',
      threshold: thresholds.p95Ms,
      actual: input.result.p95,
      op: '<=',
    });
  }

  appendOptionalBreach(
    breaches,
    'cost.perRequestUsd',
    '<=',
    thresholds.costUsd,
    input.metrics?.costUsd,
    Number.POSITIVE_INFINITY,
  );
  appendOptionalBreach(
    breaches,
    'token.totalTokens',
    '<=',
    thresholds.tokens,
    input.metrics?.tokens,
    Number.POSITIVE_INFINITY,
  );
  appendOptionalBreach(
    breaches,
    'accuracy.score',
    '>=',
    thresholds.accuracy,
    input.metrics?.accuracy,
    Number.NEGATIVE_INFINITY,
  );

  const verdict: ReleaseGateVerdict = {
    passed: breaches.length === 0,
    blockers: breaches,
    axesEvaluated: enabledAxes,
  };

  return { report, verdict, breaches };
}

function buildReport(
  input: PerfGateInput,
  thresholds: Thresholds,
  empty: boolean,
): QualityReport {
  const perf = empty || thresholds.p95Ms === undefined
    ? { p50Ms: 0, p95Ms: 0, p99Ms: 0, samples: 0 }
    : {
        p50Ms: input.result.p50,
        p95Ms: input.result.p95,
        p99Ms: input.result.p99,
        samples: input.result.samples.length,
      };
  const report: QualityReport = {
    provider: `@kiwa-test/perf-harness/${input.result.name}`,
    version: '0.1.0',
    reportedAt: new Date().toISOString(),
    coverage: { line: 0, branch: 0, function: 0 },
    testCount: { behavior: 0, integration: 0, e2e: 0, total: 0 },
    fidelity: { mockCoveredMethods: 0, realTotalMethods: 0, ratio: 0 },
    perf,
    mutation: { mutations: 0, killed: 0, survived: 0, killRate: 0 },
  };
  if (!empty && thresholds.costUsd !== undefined) {
    const actual = input.metrics?.costUsd ?? 0;
    report.cost = { perRequestUsd: actual, totalUsd: actual, requests: 1 };
  }
  if (!empty && thresholds.tokens !== undefined) {
    const actual = input.metrics?.tokens ?? 0;
    report.token = {
      promptTokens: actual,
      completionTokens: 0,
      totalTokens: actual,
      requests: 1,
    };
  }
  if (!empty && thresholds.accuracy !== undefined) {
    report.accuracy = {
      score: input.metrics?.accuracy ?? 0,
      samples: 1,
      method: 'provided',
    };
  }
  return report;
}

function appendOptionalBreach(
  breaches: ReleaseGateBlocker[],
  axis: string,
  op: '>=' | '<=',
  threshold: number | undefined,
  actual: number | undefined,
  missingFallback: number,
): void {
  if (threshold === undefined) {
    return;
  }
  const resolvedActual = actual ?? missingFallback;
  const passed = op === '<=' ? resolvedActual <= threshold : resolvedActual >= threshold;
  if (!passed) {
    breaches.push({
      axis,
      threshold,
      actual: resolvedActual,
      op,
    });
  }
}

function countThresholds(thresholds: Thresholds): number {
  return [
    thresholds.p95Ms,
    thresholds.costUsd,
    thresholds.tokens,
    thresholds.accuracy,
  ].filter((value) => value !== undefined).length;
}
