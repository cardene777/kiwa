import type {
  MutationMetric,
  MutationTier,
  QualityReport,
  ReleaseGateBlocker,
  ReleaseGateContext,
  ReleaseGateThresholds,
  ReleaseGateVerdict,
} from './types.js';
import { isAiLlmProvider } from './types.js';

/**
 * 4-tier mutation kill-rate SSOT — v1.27-4。 各 tier の値は
 * `docs/quality/mutation-thresholds.md` の `high` 列 (green threshold)。
 * per-package looser override は {@link ReleaseGateContext.mutationTierThreshold}
 * または {@link assertMutationTier} 引数で個別指定する。
 */
export const DEFAULT_MUTATION_TIER_THRESHOLDS: Readonly<Record<MutationTier, number>> = Object.freeze({
  core: 80,
  framework: 70,
  saas: 65,
  'test-type': 60,
});

/**
 * baseline JSON の verbal tier label (`Core` / `Framework` / `SaaS` /
 * `Test type`) を machine-friendly {@link MutationTier} enum に正規化する。
 * baseline (`docs/quality/mutation-thresholds.md`) と runtime gate 経路を
 * 1 経路に集約する SSOT helper。
 *
 * case-insensitive + trim 対応。 未知 label は throw して silent drift を防ぐ。
 */
export function resolveMutationTier(label: string): MutationTier {
  const key = label.trim().toLowerCase();
  switch (key) {
    case 'core':
      return 'core';
    case 'framework':
      return 'framework';
    case 'saas':
      return 'saas';
    case 'test type':
    case 'test-type':
      return 'test-type';
    default:
      throw new Error(
        `resolveMutationTier: unknown mutation tier label "${label}" (expected Core / Framework / SaaS / Test type)`,
      );
  }
}

/**
 * 単一 {@link MutationMetric} を tier default threshold (または override) と
 * 突合して pass / fail を判定する helper。 fail 時は actual + threshold +
 * tier を error message に含めて actionable にする (rules/quality.md AC 具体表現)。
 *
 * `metric.mutations === 0` は「no signal」 として fail 扱い。 空 test suite の
 * 0/0 = 0% が silent pass するのを防ぐ。
 */
export function assertMutationTier(input: {
  metric: MutationMetric;
  tier: MutationTier;
  threshold?: number;
}): void {
  const threshold = input.threshold ?? DEFAULT_MUTATION_TIER_THRESHOLDS[input.tier];
  if (input.metric.mutations === 0) {
    throw new Error(
      `assertMutationTier: no mutation signal (0 mutations) for tier "${input.tier}" — empty suite would slip past a 0/0 = 0% gate`,
    );
  }
  const actual = input.metric.killRate;
  if (actual + 0.0001 < threshold) {
    throw new Error(
      `assertMutationTier: mutation kill rate ${actual.toFixed(2)}% below "${input.tier}" tier threshold ${threshold}%`,
    );
  }
}

/**
 * Default release-gate thresholds (11 軸)。 共通 7 軸は v1.11 milestone の
 * 業界標準基準、 AI-LLM 4 軸は v1.12 milestone (Issue #695) で新設。
 *
 * 共通 7 軸 (全 provider) ...
 * - coverage 85% line / 80% branch / 90% function
 * - fidelity 70% ratio
 * - perf p95 100ms (unit-scope adapter)
 * - mutation 60% kill rate
 * - behavior test 10 件以上
 *
 * AI-LLM 4 軸 (`@kiwa-test/ai-*` provider のみ強制) ...
 * - cost ≤ $0.10 / request (Anthropic / OpenAI 実勢価格帯の bar)
 * - latency p95 ≤ 3000ms (streaming LLM の user-facing bar)
 * - token ≤ 4000 / request (context bloat 検出、 4k model 前提)
 * - accuracy ≥ 0.80 (embedding cosine 0.80 = 意味的に近い bar)
 */
export const DEFAULT_RELEASE_GATE_THRESHOLDS: ReleaseGateThresholds = {
  coverageLine: 85,
  coverageBranch: 80,
  coverageFunction: 90,
  fidelityRatio: 70,
  perfP95Ms: 100,
  mutationKillRate: 60,
  behaviorTests: 10,
  costPerRequestUsd: 0.1,
  latencyP95Ms: 3000,
  totalTokens: 4000,
  accuracyScore: 0.8,
};

/**
 * Evaluate a report against the release gate. Returns the verdict + a
 * complete list of blockers so callers can render actionable messages.
 *
 * The verdict is `passed = true` when every axis clears its threshold. A
 * partial pass (some axes clear, some fail) still returns `passed = false`
 * because release gate is all-or-nothing.
 *
 * AI-LLM provider (`@kiwa-test/ai-*`) は共通 7 軸に加えて 4 軸 (cost /
 * latency / token / accuracy) を追加検査、 4 軸のうち report にない field
 * は blocker として扱う (欠損 = 未計測 = 未満)。 それ以外の provider は
 * 7 軸のまま (breaking change なし)。
 *
 * v1.27-4 で 12 番目 axis `mutation.tier` を optional 追加。 `context.mutationTier`
 * が指定された場合のみ 4-tier threshold (Core 80 / Framework 70 / SaaS 65 /
 * Test type 60) と kill rate を突合、 これは既存 `mutation.killRate` axis と
 * **並存** する (置換ではない)、 legacy overrides もそのまま機能する。
 */
export function evaluateReleaseGate(
  report: QualityReport,
  overrides: Partial<ReleaseGateThresholds> = {},
  context: ReleaseGateContext = {},
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

  let axesEvaluated = 7;
  if (isAiLlmProvider(report.provider)) {
    axesEvaluated = 11;
    // 欠損時は Infinity / -Infinity で floor / ceiling を必ず fail させる。
    const costActual = report.cost?.perRequestUsd ?? Number.POSITIVE_INFINITY;
    const latencyActual = report.latency?.p95Ms ?? Number.POSITIVE_INFINITY;
    const tokenActual = report.token?.totalTokens ?? Number.POSITIVE_INFINITY;
    const accuracyActual = report.accuracy?.score ?? Number.NEGATIVE_INFINITY;

    check('cost.perRequestUsd', costActual, thresholds.costPerRequestUsd, '<=');
    check('latency.p95Ms', latencyActual, thresholds.latencyP95Ms, '<=');
    check('token.totalTokens', tokenActual, thresholds.totalTokens, '<=');
    check('accuracy.score', accuracyActual, thresholds.accuracyScore, '>=');
  }

  if (context.mutationTier !== undefined) {
    axesEvaluated += 1;
    const tierThreshold =
      context.mutationTierThreshold ??
      DEFAULT_MUTATION_TIER_THRESHOLDS[context.mutationTier];
    check('mutation.tier', report.mutation.killRate, tierThreshold, '>=');
  }

  return {
    passed: blockers.length === 0,
    blockers,
    axesEvaluated,
  };
}
