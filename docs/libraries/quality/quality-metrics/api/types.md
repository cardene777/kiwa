---
title: "@kiwa-lab/quality-metrics types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/quality-metrics</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>isAiLlmProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L462) <code v-pre>packages/quality-metrics/src/types.ts</code>

`@kiwa-lab/ai-*` provider か判定する helper。 release gate と emit が AI-LLM 4 軸の有無を分岐する SSOT。

```ts
export declare function isAiLlmProvider(provider: string): boolean;
```

### 型

#### <code v-pre>A11yMetric</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L156) <code v-pre>packages/quality-metrics/src/types.ts</code>

A11y (axe-core WCAG 2.1 AA) violation counts per impact — v1.30-4 SSOT。 shape は axe-core の `impact` field (`critical` / `serious` / `moderate` / `minor`) をそのまま持ち、 `.a11y-baseline/{pkg}.json` の `totals` block から {@link a11yFromBaseline } で構築する。 `critical` は SSOT 不変で どの tier でも 0 が bar (docs/quality/a11y-thresholds.md § Overrides)。 `minor` は release gate では判定しないが shape 一貫性のため保持する (team review 用)。

```ts
export interface A11yMetric {
    /** WCAG 2.1 AA critical impact violation count (SSOT: 常に 0 が bar)。 */
    critical: number;
    /** WCAG 2.1 AA serious impact violation count。 */
    serious: number;
    /** WCAG 2.1 AA moderate impact violation count。 */
    moderate: number;
    /** WCAG 2.1 AA minor impact violation count (release gate 判定外)。 */
    minor: number;
}
```

#### <code v-pre>A11yThreshold</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L189) <code v-pre>packages/quality-metrics/src/types.ts</code>

A11y threshold per tier — 3 impact ceiling (critical / serious / moderate)。 `minor` は release gate 判定外なので閾値表にも入れない。 SSOT invariant: `critical` は常に 0 (docs/quality/a11y-thresholds.md § Overrides "No override may ever raise the critical bar")。

```ts
export interface A11yThreshold {
    /** Critical impact ceiling — SSOT invariant 0。 */
    critical: 0;
    /** Serious impact ceiling — tier 毎の許容上限 (Core 0 / Framework 3 / SaaS 0 / Test type 3)。 */
    serious: number;
    /** Moderate impact ceiling — tier 毎の許容上限 (Core 3 / Framework 10 / SaaS 0 / Test type 10)。 */
    moderate: number;
}
```

#### <code v-pre>A11yTier</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L180) <code v-pre>packages/quality-metrics/src/types.ts</code>

4-tier a11y threshold classification — v1.30-4 SSOT。 shape / 意味は {@link MutationTier} と統一 (SSOT: docs/quality/a11y-thresholds.md § Tier table)。 - `core` = pure logic packages with no DOM output (bar 0/0/3) - `framework` = SSR / hydration / adapter wrapper (bar 0/3/10) - `saas` = provider-specific adapter (bar 0/0/0, strict) - `test-type` = test harness with DOM measurement noise (bar 0/3/10) baseline JSON (`docs/quality/a11y-thresholds.md` に verbal `Core` / `Framework` / `SaaS` / `Test type` で書かれる) は {@link resolveA11yTier } で本 enum に正規化する。

```ts
export type A11yTier = 'core' | 'framework' | 'saas' | 'test-type';
```

#### <code v-pre>AccuracyMetric</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L255) <code v-pre>packages/quality-metrics/src/types.ts</code>

Accuracy metric for AI-LLM providers — golden 出力に対する 0.0-1.0 similarity score。 embedding cosine similarity, BLEU, exact match など 計測 method は provider adapter が選択、 shape のみ SSOT。

```ts
export interface AccuracyMetric {
    /**
     * 0.0-1.0 の similarity score (1.0 = golden と完全一致)。
     * embedding cosine / BLEU / exact-match のいずれかで算出、
     * `method` field で計測方法を明示する。
     */
    score: number;
    /** score の計測に使った sample 数。 */
    samples: number;
    /** score 算出 method (`cosine` / `bleu` / `exact-match` / free-form)。 */
    method: string;
}
```

#### <code v-pre>CostMetric</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L205) <code v-pre>packages/quality-metrics/src/types.ts</code>

Cost metric for AI-LLM providers — 1 request 当たりの US$ 実測。 `perRequestUsd` は「1 request 当たり単価の観測値」、 `totalUsd` は ベンチ全体の合算。 release gate は `perRequestUsd` の平均で判定 (bulk 呼出時のコスト暴騰を検出する用途)。

```ts
export interface CostMetric {
    /** 1 request 当たりの平均コスト (US$)。 */
    perRequestUsd: number;
    /** ベンチ全体の合算コスト (US$)。 */
    totalUsd: number;
    /** コスト計測に含まれた request 数。 */
    requests: number;
}
```

#### <code v-pre>CoverageMetric</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L41) <code v-pre>packages/quality-metrics/src/types.ts</code>

Line / branch / function coverage percentages, all 0–100.

```ts
export interface CoverageMetric {
    /** Line coverage percentage (0–100). */
    line: number;
    /** Branch coverage percentage (0–100). */
    branch: number;
    /** Function coverage percentage (0–100). */
    function: number;
}
```

#### <code v-pre>FidelityMetric</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L80) <code v-pre>packages/quality-metrics/src/types.ts</code>

Fidelity score — how faithfully the mock adapter matches the real provider. `mockCoveredMethods` = number of API methods the kiwa mock implements. `realTotalMethods` = number of public methods on the real provider's SDK. The score is the ratio expressed as a percentage (0–100). A high fidelity score does not guarantee semantic equivalence — a v1.11 dogfood app run against both modes is the definitive source of truth for behavioral fidelity. This shape captures surface fidelity as the objective proxy.

```ts
export interface FidelityMetric {
    mockCoveredMethods: number;
    realTotalMethods: number;
    /**
     * Computed percentage = `mockCoveredMethods / realTotalMethods × 100`.
     * When `realTotalMethods = 0`, the ratio is defined as 100.
     */
    ratio: number;
    /**
     * Optional — count of behavioral divergences observed during dogfood test
     * comparison. Zero means real and mock modes produced identical results.
     */
    behavioralDivergences?: number | undefined;
}
```

#### <code v-pre>LatencyMetric</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L221) <code v-pre>packages/quality-metrics/src/types.ts</code>

Latency metric for AI-LLM providers — non-deterministic 前提の end-to-end response time (ms)。 {@link PerfMetric} と shape は同じだが、 PerfMetric は unit-scope adapter setup + call の bar (100ms 上限)、 LatencyMetric は user-facing LLM response 全体の bar (3000ms 上限) と 役割が異なる。

```ts
export interface LatencyMetric {
    /** 50th percentile end-to-end latency (ms)。 */
    p50Ms: number;
    /** 95th percentile end-to-end latency (ms)。 */
    p95Ms: number;
    /** 99th percentile end-to-end latency (ms)。 */
    p99Ms: number;
    /** Sample count that fed the percentiles. */
    samples: number;
}
```

#### <code v-pre>MutationMetric</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L121) <code v-pre>packages/quality-metrics/src/types.ts</code>

Mutation testing kill rate.

```ts
export interface MutationMetric {
    /** Total mutations generated. */
    mutations: number;
    /** Mutations killed by the test suite. */
    killed: number;
    /** Mutations that survived (indicate test gap). */
    survived: number;
    /** Kill rate percentage = killed / mutations × 100. */
    killRate: number;
}
```

#### <code v-pre>MutationTier</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L144) <code v-pre>packages/quality-metrics/src/types.ts</code>

4-tier mutation threshold classification — v1.27-4 SSOT。 `core` = pure logic (deterministic tests、 no framework noise)、 `framework` = SSR / hydration / adapter drift、 `saas` = provider-specific adapter (external API drift 前提)、 `test-type` = DOM / browser noise を含む harness package。 baseline JSON (`docs/quality/mutation-thresholds.md` に verbal `Core` / `Framework` / `SaaS` / `Test type` で書かれる) は {@link resolveMutationTier } で本 enum に正規化する。

```ts
export type MutationTier = 'core' | 'framework' | 'saas' | 'test-type';
```

#### <code v-pre>PerfMetric</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L96) <code v-pre>packages/quality-metrics/src/types.ts</code>

Performance percentiles in milliseconds.

```ts
export interface PerfMetric {
    /** 50th percentile latency in ms. */
    p50Ms: number;
    /** 95th percentile latency in ms. */
    p95Ms: number;
    /** 99th percentile latency in ms. */
    p99Ms: number;
    /** Total sample count that fed the percentiles. */
    samples: number;
    /**
     * v0.4 strict mode indicator。 true = strict variant で計測済
     * (perf-harness v0.3 runPerf3LayerStrict + iter 400 + Welch |t|>3 + delta 10%)、
     * false / undefined = v0.2 lax mode。
     * strict = true の場合、 release gate は perf.strict axis も評価する。
     */
    strict?: boolean;
    /**
     * v0.4 strict baseline 存在フラグ。 true = .perf-baseline/{name}.json 存在確認済、
     * false / undefined = baseline 未生成 (regression 検知不能)。 release gate で
     * strict = true + baselineExists = false は fail-fast。
     */
    baselineExists?: boolean;
}
```

#### <code v-pre>QualityReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L273) <code v-pre>packages/quality-metrics/src/types.ts</code>

Full quality report for a single provider (or subject under test). 共通 5 軸 + AI-LLM 4 軸 (optional) を同一 shape で保持、 downstream consumer が provider prefix で軸を選別する。

```ts
export interface QualityReport {
    /** Provider / package identifier — e.g. `@kiwa-lab/auth` or `@kiwa-lab/ai-llm`. */
    provider: string;
    /** Version string as declared in package.json. */
    version: string;
    /** ISO 8601 timestamp of the report. */
    reportedAt: string;
    coverage: CoverageMetric;
    testCount: TestCountMetric;
    fidelity: FidelityMetric;
    perf: PerfMetric;
    mutation: MutationMetric;
    /** AI-LLM 4 軸 — provider が `@kiwa-lab/ai-*` のときのみ必須。 */
    cost?: CostMetric | undefined;
    latency?: LatencyMetric | undefined;
    token?: TokenMetric | undefined;
    accuracy?: AccuracyMetric | undefined;
    /**
     * A11y 4 impact 軸 (v1.30-4) — `.a11y-baseline/{pkg}.json` の totals から
     * {@link a11yFromBaseline} で構築。 {@link ReleaseGateContext.a11yTier}
     * 指定時のみ release gate が参照する。
     */
    a11y?: A11yMetric | undefined;
    /** Optional free-form notes surfaced in the emitted markdown report. */
    notes?: string | undefined;
}
```

#### <code v-pre>QualityReportDiff</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L440) <code v-pre>packages/quality-metrics/src/types.ts</code>

Trend delta between two reports for the same provider — used by {@link diffReports }. Values are (`current - previous`) so positive numbers mean improvement for `coverage` / `test count` / `fidelity` / `mutation` / `accuracy`, and negative numbers mean improvement for `perf` / `latency` / `cost` / `token`.

```ts
export interface QualityReportDiff {
    provider: string;
    from: string;
    to: string;
    coverage: CoverageMetric;
    testCount: TestCountMetric;
    fidelity: Pick<FidelityMetric, 'ratio'>;
    perf: PerfMetric;
    mutation: Pick<MutationMetric, 'killRate'>;
    /** AI-LLM 4 軸 diff (両 report とも AI-LLM のときのみ設定)。 */
    cost?: Pick<CostMetric, 'perRequestUsd'> | undefined;
    latency?: Pick<LatencyMetric, 'p95Ms'> | undefined;
    token?: Pick<TokenMetric, 'totalTokens'> | undefined;
    accuracy?: Pick<AccuracyMetric, 'score'> | undefined;
    /** A11y 3 impact diff (v1.30-4、 両 report とも a11y を持つときのみ設定)。 */
    a11y?: Pick<A11yMetric, 'critical' | 'serious' | 'moderate'> | undefined;
}
```

#### <code v-pre>ReleaseGateBlocker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L343) <code v-pre>packages/quality-metrics/src/types.ts</code>

Reason a report failed the release gate. Each blocker names the axis.

```ts
export interface ReleaseGateBlocker {
    /**
     * Axis name that failed — e.g. `coverage.line`, `perf.p95Ms`,
     * `mutation.tier` (v1.27-4 tier-aware kill rate check).
     */
    axis: string;
    /** Threshold that was violated. */
    threshold: number;
    /** Actual value observed in the report. */
    actual: number;
    /** Comparison operator that was applied — either `>=` (floor) or `<=` (ceiling). */
    op: '>=' | '<=';
}
```

#### <code v-pre>ReleaseGateContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L379) <code v-pre>packages/quality-metrics/src/types.ts</code>

Optional context that opts a report into the tier-aware axes (mutation.tier v1.27-4 + a11y.tier v1.30-4 + drift.* v1.66). Passed as the third argument of {@link evaluateReleaseGate }. Absent fields = legacy 7 / 11 axis behaviour (backward compatible).

```ts
export interface ReleaseGateContext {
    /**
     * Mutation tier of the package under evaluation. When set, a `mutation.tier`
     * axis is added that enforces {@link DEFAULT_MUTATION_TIER_THRESHOLDS}
     * unless {@link mutationTierThreshold} overrides it.
     */
    mutationTier?: MutationTier;
    /**
     * Optional per-package looser override for the mutation tier default (e.g.
     * auth 65 on Framework tier). Documented per-baseline in
     * `.mutation-baseline/*.json`.
     */
    mutationTierThreshold?: number;
    /**
     * A11y tier of the package under evaluation (v1.30-4). When set, an
     * `a11y.tier` axis is added that enforces {@link DEFAULT_A11Y_TIER_THRESHOLDS}
     * unless {@link a11yTierThreshold} overrides it. If the report has no
     * `a11y` field the axis fails safe (critical = Infinity) so silent
     * "no data" runs cannot pass.
     */
    a11yTier?: A11yTier;
    /**
     * Optional per-package looser override for the a11y tier default (e.g.
     * component overrides moderate to 0 while staying Test type tier).
     * `critical` is always 0 — SSOT invariant, never overridable.
     */
    a11yTierThreshold?: A11yThreshold;
    /**
     * v0.6 drift check opt-in — baseline snapshot を渡すと drift 検知が
     * release gate に統合される。 v0.5 で 提供した pure library の
     * `captureSnapshot` + `compareToBaseline` + `detectDrift` の chain を
     * `evaluateReleaseGate` 内部で実行、 regression 検知 axis を
     * `drift.{axis名}` として {@link ReleaseGateBlocker} に格上げする。
     *
     * 発火条件 = `driftEnabled === true` かつ `driftBaseline` 存在。 default
     * off (両 field 不在) で v0.5 までの 11 / 13 axis 動作を厳密に維持
     * (backward compat 絶対維持)。
     *
     * `MetricSnapshot` の import は shape だけの循環参照回避のため
     * `history.js` 経由。
     */
    driftBaseline?: import('./history.js').MetricSnapshot;
    /**
     * v0.6 drift 判定 の 絶対値 delta% 閾値 (default 5.0)。 {@link detectDrift}
     * の `thresholdPct` に そのまま 渡る。 driftBaseline 不在時は 無視。
     */
    driftThresholdPct?: number;
    /**
     * v0.6 drift check opt-in flag。 true + driftBaseline 存在で drift 発火、
     * 他の 組合せは 全て skip (default off で backward compat)。
     */
    driftEnabled?: boolean;
}
```

#### <code v-pre>ReleaseGateThresholds</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L305) <code v-pre>packages/quality-metrics/src/types.ts</code>

Release gate thresholds — 11 軸 SSOT。 共通 7 軸 (全 provider) + AI-LLM 4 軸 (`@kiwa-lab/ai-*` provider のみ強制) の閾値。 provider は overrides で 個別調整可能。

```ts
export interface ReleaseGateThresholds {
    /** Minimum line coverage percentage (default 85). */
    coverageLine: number;
    /** Minimum branch coverage percentage (default 80). */
    coverageBranch: number;
    /** Minimum function coverage percentage (default 90). */
    coverageFunction: number;
    /** Minimum fidelity ratio (default 70). */
    fidelityRatio: number;
    /** Maximum acceptable p95 latency in ms (default 100). */
    perfP95Ms: number;
    /** Minimum mutation kill rate percentage (default 60). */
    mutationKillRate: number;
    /** Minimum behavior test count (default 10). */
    behaviorTests: number;
    /** AI-LLM 上限 — 1 request 当たり平均コスト (US$、 default 0.10)。 */
    costPerRequestUsd: number;
    /** AI-LLM 上限 — end-to-end p95 latency (ms、 default 3000)。 */
    latencyP95Ms: number;
    /** AI-LLM 上限 — 1 request 当たり平均総 token 数 (default 4000)。 */
    totalTokens: number;
    /** AI-LLM 下限 — golden vs 実出力 similarity score (default 0.80)。 */
    accuracyScore: number;
    /**
     * v0.4 perf strict axis — strict mode で計測された PerfMetric に対して
     * `perf.strict.p95Ms` の上限 (default 50 = lax の半分)。 lax mode の PerfMetric
     * (strict != true) は本 axis を skip する (backward compat)。
     */
    perfStrictP95Ms: number;
    /**
     * v0.4 perf strict baseline 存在必須フラグ。 true = strict mode の
     * PerfMetric に対して baselineExists = true を必須化 (baseline 未生成なら
     * fail-fast)。 default true。
     */
    perfStrictRequireBaseline: boolean;
}
```

#### <code v-pre>ReleaseGateVerdict</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L358) <code v-pre>packages/quality-metrics/src/types.ts</code>

Verdict of {@link evaluateReleaseGate }.

```ts
export interface ReleaseGateVerdict {
    passed: boolean;
    blockers: ReleaseGateBlocker[];
    /**
     * Number of axes evaluated. Base counts:
     * - 7 for non-AI-LLM without any tier axis,
     * - 11 for AI-LLM without any tier axis.
     *
     * Each of `context.mutationTier` (v1.27-4) and `context.a11yTier` (v1.30-4)
     * adds 1 axis independently, so a caller can end up with 7 / 8 / 9 base or
     * 11 / 12 / 13 with AI-LLM.
     */
    axesEvaluated: number;
}
```

#### <code v-pre>TestCountMetric</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L51) <code v-pre>packages/quality-metrics/src/types.ts</code>

Test count broken down by kind. Sum = `total`.

```ts
export interface TestCountMetric {
    /**
     * Unit-level behavior tests — direct exercise of a package's API surface
     * without external dependencies. Should be the majority of tests.
     */
    behavior: number;
    /**
     * Integration tests — package + workspace peers + framework glue.
     */
    integration: number;
    /**
     * E2E / dogfood app tests — a full flow against real user-facing shape.
     */
    e2e: number;
    /** Sum of the three kinds (derived, must equal behavior + integration + e2e). */
    total: number;
}
```

#### <code v-pre>TokenMetric</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L239) <code v-pre>packages/quality-metrics/src/types.ts</code>

Token metric for AI-LLM providers — 1 request 当たりの token 使用量。 `promptTokens` は input side、 `completionTokens` は output side、 `totalTokens` は `promptTokens + completionTokens`。 release gate は `totalTokens` の平均で判定 (context bloat 検出)。

```ts
export interface TokenMetric {
    /** 1 request 当たりの平均 prompt (input) token 数。 */
    promptTokens: number;
    /** 1 request 当たりの平均 completion (output) token 数。 */
    completionTokens: number;
    /** 1 request 当たりの平均総 token 数 (prompt + completion)。 */
    totalTokens: number;
    /** token 計測に含まれた request 数。 */
    requests: number;
}
```
