import { captureSnapshot, compareToBaseline, detectDrift } from './history.js';
import type {
  A11yMetric,
  A11yThreshold,
  A11yTier,
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
 * 4-tier a11y (axe-core WCAG 2.1 AA) threshold SSOT — v1.30-4。 各 tier の
 * 3 impact ceiling (critical / serious / moderate) は
 * `docs/quality/a11y-thresholds.md` § Tier table SSOT を写しである。 `critical`
 * は常に 0 (SSOT invariant, "No override may ever raise the critical bar")、
 * `minor` は release gate 判定外なので閾値表に入れない (team review 用)。
 *
 * per-package looser override は {@link ReleaseGateContext.a11yTierThreshold}
 * または {@link assertA11yTier} 引数で個別指定する。 stricter override (floor
 * を上げる) は承認不要、 looser override は PR body に one-line justification
 * を残す運用 (SSOT § Overrides)。
 */
export const DEFAULT_A11Y_TIER_THRESHOLDS: Readonly<Record<A11yTier, A11yThreshold>> = Object.freeze({
  core: { critical: 0, serious: 0, moderate: 3 },
  framework: { critical: 0, serious: 3, moderate: 10 },
  saas: { critical: 0, serious: 0, moderate: 0 },
  'test-type': { critical: 0, serious: 3, moderate: 10 },
});

/**
 * baseline JSON の verbal tier label (`Core` / `Framework` / `SaaS` /
 * `Test type`) を machine-friendly {@link A11yTier} enum に正規化する。
 * baseline (`docs/quality/a11y-thresholds.md`) と runtime gate 経路を 1
 * 経路に集約する SSOT helper。 shape / 動作は {@link resolveMutationTier}
 * と統一 (1 pattern review)。
 *
 * case-insensitive + trim 対応。 未知 label は throw して silent drift を防ぐ。
 */
export function resolveA11yTier(label: string): A11yTier {
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
        `resolveA11yTier: unknown a11y tier label "${label}" (expected Core / Framework / SaaS / Test type)`,
      );
  }
}

/**
 * 単一 {@link A11yMetric} を tier default threshold (または override) と
 * 突合して pass / fail を判定する helper。 3 impact (critical / serious /
 * moderate) を独立にチェック、 fail 時は impact + actual + threshold + tier
 * を error message に含めて actionable にする (rules/quality.md AC 具体表現)。
 *
 * mutation tier と異なり、 zero-violation metric (0/0/0) は pass 扱い
 * — a11y は「違反 0 が理想状態」 なので silent success で良い
 * (SSOT: docs/quality/a11y-thresholds.md § 13-axis release gate integration
 * "Empty-violation metrics do not throw")。
 *
 * `critical` は SSOT invariant で常に 0、 override で 0 以外にできない
 * 型契約は {@link A11yThreshold} の `critical: 0` literal で保証済み。
 */
export function assertA11yTier(input: {
  metric: A11yMetric;
  tier: A11yTier;
  threshold?: A11yThreshold;
}): void {
  const threshold = input.threshold ?? DEFAULT_A11Y_TIER_THRESHOLDS[input.tier];
  const { critical, serious, moderate } = input.metric;
  if (critical > threshold.critical) {
    throw new Error(
      `assertA11yTier: critical impact ${critical} > ${threshold.critical} — "${input.tier}" tier does not allow critical > 0 (SSOT: docs/quality/a11y-thresholds.md)`,
    );
  }
  if (serious > threshold.serious) {
    throw new Error(
      `assertA11yTier: serious impact ${serious} > ${threshold.serious} — "${input.tier}" tier ceiling breached`,
    );
  }
  if (moderate > threshold.moderate) {
    throw new Error(
      `assertA11yTier: moderate impact ${moderate} > ${threshold.moderate} — "${input.tier}" tier ceiling breached`,
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
 * AI-LLM 4 軸 (`@kiwa-lab/ai-*` provider のみ強制) ...
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
  perfStrictP95Ms: 50,
  perfStrictRequireBaseline: true,
};

/**
 * Evaluate a report against the release gate. Returns the verdict + a
 * complete list of blockers so callers can render actionable messages.
 *
 * The verdict is `passed = true` when every axis clears its threshold. A
 * partial pass (some axes clear, some fail) still returns `passed = false`
 * because release gate is all-or-nothing.
 *
 * AI-LLM provider (`@kiwa-lab/ai-*`) は共通 7 軸に加えて 4 軸 (cost /
 * latency / token / accuracy) を追加検査、 4 軸のうち report にない field
 * は blocker として扱う (欠損 = 未計測 = 未満)。 それ以外の provider は
 * 7 軸のまま (breaking change なし)。
 *
 * v1.27-4 で 12 番目 axis `mutation.tier` を optional 追加。 `context.mutationTier`
 * が指定された場合のみ 4-tier threshold (Core 80 / Framework 70 / SaaS 65 /
 * Test type 60) と kill rate を突合、 これは既存 `mutation.killRate` axis と
 * **並存** する (置換ではない)、 legacy overrides もそのまま機能する。
 *
 * v1.30-4 で 13 番目 axis `a11y.tier` を optional 追加。 `context.a11yTier`
 * が指定された場合のみ 4-tier threshold (Core 0/0/3 / Framework 0/3/10 /
 * SaaS 0/0/0 / Test type 0/3/10) と report.a11y の 3 impact (critical /
 * serious / moderate) を突合、 fail 時は impact 毎に個別 blocker を積む。
 * report.a11y が undefined の場合は critical Infinity fallback で必ず fail
 * (silent "no data" pass を防止)。
 *
 * v1.66 で drift 統合 axis 群 `drift.*` を optional 追加。
 * `context.driftEnabled === true` かつ `context.driftBaseline` 存在時のみ
 * v0.5 の `captureSnapshot` + `compareToBaseline` + `detectDrift` を chain
 * 実行、 regression 検知 axis を `drift.{axis名}` の {@link ReleaseGateBlocker}
 * として 1:1 格上げする。 driftEnabled が false / 省略で default off、
 * v0.5 までの 11 / 13 axis 動作を 厳密に 維持 (backward compat 絶対維持)。
 * regressions 数 = drift blocker 数、 axesEvaluated は drift lane を +1 の 単一 lane
 * として 加算 (mutation.tier / a11y.tier と 同一 設計)。
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

  // v0.4 perf strict axis — strict mode で計測された PerfMetric に対してのみ評価。
  // strict != true の場合は skip (backward compat)、 strict = true なら追加 axis
  // として fail-fast 判定。 baseline 必須 flag が true + baselineExists != true
  // なら strict.baseline axis を fail-fast で発火。
  let axesEvaluated = 7;
  if (report.perf.strict === true) {
    check('perf.strict.p95Ms', report.perf.p95Ms, thresholds.perfStrictP95Ms, '<=');
    axesEvaluated++;
    if (thresholds.perfStrictRequireBaseline) {
      const baselineExists = report.perf.baselineExists === true;
      if (!baselineExists) {
        blockers.push({
          axis: 'perf.strict.baseline',
          threshold: 1,
          actual: 0,
          op: '>=',
        });
      }
      axesEvaluated++;
    }
  }
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

  if (context.a11yTier !== undefined) {
    // 13th axis emits at most 1 blocker per fail; axesEvaluated counts the
    // single a11y.tier lane regardless of how many impact ceilings were
    // breached (mirrors mutation.tier: 1 tier check = 1 axis).
    axesEvaluated += 1;
    const a11yThreshold =
      context.a11yTierThreshold ?? DEFAULT_A11Y_TIER_THRESHOLDS[context.a11yTier];
    // 欠損時は critical Infinity で必ず fail、 silent "no a11y data" pass 防止
    // (AI-LLM axis の Number.POSITIVE_INFINITY / NEGATIVE_INFINITY fallback
    // と同じ設計)。
    const critical = report.a11y?.critical ?? Number.POSITIVE_INFINITY;
    const serious = report.a11y?.serious ?? Number.POSITIVE_INFINITY;
    const moderate = report.a11y?.moderate ?? Number.POSITIVE_INFINITY;
    // 優先順位で最初に breach した impact を 1 件だけ blocker に積む
    // (critical > serious > moderate)。 axis 数 = tier lane 単位で数える
    // ため、 blocker 数と axesEvaluated は独立。 downstream の error
    // message は blocker.threshold + blocker.actual + blocker.op で十分。
    if (critical > a11yThreshold.critical) {
      blockers.push({
        axis: 'a11y.tier',
        threshold: a11yThreshold.critical,
        actual: critical,
        op: '<=',
      });
    } else if (serious > a11yThreshold.serious) {
      blockers.push({
        axis: 'a11y.tier',
        threshold: a11yThreshold.serious,
        actual: serious,
        op: '<=',
      });
    } else if (moderate > a11yThreshold.moderate) {
      blockers.push({
        axis: 'a11y.tier',
        threshold: a11yThreshold.moderate,
        actual: moderate,
        op: '<=',
      });
    }
  }

  // v0.6 drift 統合 axis 群 — driftEnabled + driftBaseline 両立時のみ発火。
  // v0.5 の pure library (captureSnapshot + compareToBaseline + detectDrift)
  // を そのまま chain、 regression を 1:1 で ReleaseGateBlocker に格上げ。
  // axesEvaluated は drift lane を +1 の 単一 lane として 加算
  // (mutation.tier / a11y.tier と 同一 設計、 blocker 数と 独立)。
  if (context.driftEnabled === true && context.driftBaseline !== undefined) {
    axesEvaluated += 1;
    const current = captureSnapshot({
      report,
      capturedAt: report.reportedAt,
      label: `current-${report.version}`,
    });
    const comparison = compareToBaseline({
      current,
      baseline: context.driftBaseline,
    });
    const drift = detectDrift(
      context.driftThresholdPct !== undefined
        ? { comparison, thresholdPct: context.driftThresholdPct }
        : { comparison },
    );
    // regression 検知 axis を drift.{axis} で 1:1 blocker 化。
    // threshold = -thresholdPct (下限違反 semantics)、 actual = delta.deltaPct、
    // op = '>=' で 「delta% が -threshold より 上」 を 満たすべき floor 検査 と
    // 解釈する (regression = actual < -threshold で fail)。
    for (const regression of drift.regressions) {
      blockers.push({
        axis: `drift.${regression.axis}`,
        threshold: -drift.threshold,
        actual: regression.deltaPct,
        op: '>=',
      });
    }
  }

  return {
    passed: blockers.length === 0,
    blockers,
    axesEvaluated,
  };
}
