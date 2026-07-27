# Quality Metrics リファレンス

`@kiwa-lab/quality-metrics` は品質信号を `QualityReport` に組み立て、release gate を評価します。

## Metric API

`coverageFromV8Summary`、`testCountFromCategories`、`fidelityFromMethodCounts`、`perfFromSamples`、`mutationFromCounts` が共通指標を作ります。coverageは0から100へ丸め、test countとmutation countは非負整数を要求します。`mutationFromCounts` はkilledがmutationsを超えるとthrowします。AI providerでは `costFromSamples`、`latencyFromSamples`、`tokenFromSamples`、`accuracyFromSamples` も使います。

`fidelityFromMethodCounts` はreal methodが0件ならratioを100とします。これは実行時挙動の一致を証明しないため、実行時比較には `assertFidelity` を使います。`assertFidelity` は戻り値をdeep strict equalityで比較し、例外はmessageが一致するときだけ一致とみなします。

`assembleReport` はprovider、version、各metricからreportを作ります。`emitJson` と `emitMarkdown` はreportとverdictを出力します。

## Gate API

`evaluateReleaseGate(report, overrides, context)` は `passed`、`blockers`、評価したaxis数を返します。既定の7軸はcoverage三種、fidelity ratio、perf p95、mutation kill rate、behavior test数です。`overrides` は既定しきい値の部分上書きです。`context.mutationTier` または `context.a11yTier` を渡すとtier axisを追加します。

`assertMutationTier` と `assertA11yTier` は単一metricを即時に検証します。mutationは0件をfail、a11yは0違反をpassと扱います。`resolveMutationTier` と `resolveA11yTier` は `core`、`framework`、`saas`、`test-type` を正規化し、未知のlabelはthrowします。

## 履歴と制約

`captureSnapshot`、`compareToBaseline`、`detectDrift`、`generateTrendReport` は時系列比較に使います。drift gateは `context.driftEnabled` とbaselineの両方を渡した場合だけ有効です。AIのcost、latency、token、accuracyはprovider名が `@kiwa-lab/ai-` の場合だけgateの追加axisになります。異なる計測条件の履歴を同じthreshold学習に混ぜないでください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| `mutationFromCounts: killed (${input.killed}) exceeds mutations (${input.mutations})` | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L115) |
| `costFromSamples: invalid sample ${s} (must be non-negative number)` | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L140) |
| `tokenFromSamples: promptTokens.length (${input.promptTokens.length}) !== completionTokens.length (${input.completionTokens.length})` | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L175) |
| 'accuracyFromSamples: method is required' | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L204) |
| `accuracyFromSamples: invalid sample ${s} (must be number in [0, 1])` | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L210) |
| `a11yFromBaseline: invalid ${field} count ${raw} (must be non-negative finite number)` | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L248) |
| 'assembleReport: provider is required' | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L285) |
| 'assembleReport: version is required' | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L286) |
| `normalizePercentage: invalid input ${pct}` | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L308) |
| `${label}: expected finite number, got ${v}` | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L317) |
| `${label}: expected non-negative integer, got ${v}` | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L320) |
| `percentilesFromSamples: invalid sample ${s} (must be non-negative number)` | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L339) |
| `nearestRank: invalid percentile ${percentile}` | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L353) |
| `diffReports: provider mismatch — ${previous.provider} vs ${current.provider}` | [packages/quality-metrics/src/emit.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/emit.ts#L157) |
| `resolveA11yTier: unknown a11y tier label "${label}" (expected Core / Framework / SaaS / Test type)` | [packages/quality-metrics/src/gate.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L124) |
| `assertA11yTier: critical impact ${critical} > ${threshold.critical} — "${input.tier}" tier does not allow critical > 0 (SSOT: docs/quality/a11y-thresholds.md)` | [packages/quality-metrics/src/gate.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L152) |
| `assertA11yTier: serious impact ${serious} > ${threshold.serious} — "${input.tier}" tier ceiling breached` | [packages/quality-metrics/src/gate.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L157) |
| `assertA11yTier: moderate impact ${moderate} > ${threshold.moderate} — "${input.tier}" tier ceiling breached` | [packages/quality-metrics/src/gate.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L162) |
| `resolveMutationTier: unknown mutation tier label "${label}" (expected Core / Framework / SaaS / Test type)` | [packages/quality-metrics/src/gate.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L50) |
| `assertMutationTier: no mutation signal (0 mutations) for tier "${input.tier}" — empty suite would slip past a 0/0 = 0% gate` | [packages/quality-metrics/src/gate.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L71) |
| `assertMutationTier: mutation kill rate ${actual.toFixed(2)}% below "${input.tier}" tier threshold ${threshold}%` | [packages/quality-metrics/src/gate.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L77) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/index.ts) から同期しています。各項目は公開名、実際の TypeScript 宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `a11yFromBaseline`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L236) `packages/quality-metrics/src/collect.ts`

Build an {@link A11yMetric} from a `.a11y-baseline/{pkg}.json` `totals` block (v1.30-4)。 baseline JSON は `{ package, generatedAt, layers, totals: { critical, serious, moderate, minor }, ok }` shape、 このヘルパは totals を A11yMetric 型に coerce する pure function。 層が全部 layers-absent (Core / Framework の no-DOM adapter) の baseline は 全 impact が 0 になる、 その場合も metric は shape 通り返す (release gate が 0/0/0 を pass 判定する SSOT)。 部分欠損 (`totals: { critical: 0 }` のみ等) は 0 default で埋める、 silent NaN / undefined を防ぐ (負値 / NaN は throw で拒否)。

```ts
export function a11yFromBaseline(input: {
  totals: {
    critical?: number;
    serious?: number;
    moderate?: number;
    minor?: number;
  };
}): A11yMetric;
```

#### `accuracyFromSamples`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L200) `packages/quality-metrics/src/collect.ts`

Build an {@link AccuracyMetric} from an array of 0.0-1.0 similarity samples。 `method` field で「どの計測方法か」 を明示 (cosine / bleu / exact-match / custom)、 score は平均。

```ts
export function accuracyFromSamples(input: {
  samples: number[];
  method: string;
}): AccuracyMetric;
```

#### `assembleReport`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L270) `packages/quality-metrics/src/collect.ts`

Assemble a full {@link QualityReport} from pre-computed axes. Fills the `reportedAt` timestamp with the current UTC ISO string. AI-LLM 4 軸 (cost / latency / token / accuracy) は provider が `@kiwa-lab/ai-*` のときのみ意味を持つ (それ以外は undefined でも通る)。 a11y 軸 (v1.30-4) は tier-aware release gate が有効な package のみ渡す、 未渡しは release gate 判定外 (context.a11yTier 指定時に critical Infinity fallback で fail-safe)。

```ts
export function assembleReport(input: {
  provider: string;
  version: string;
  coverage: CoverageMetric;
  testCount: TestCountMetric;
  fidelity: FidelityMetric;
  perf: PerfMetric;
  mutation: MutationMetric;
  cost?: CostMetric;
  latency?: LatencyMetric;
  token?: TokenMetric;
  accuracy?: AccuracyMetric;
  a11y?: A11yMetric;
  notes?: string;
}): QualityReport;
```

#### `assertA11yTier`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L144) `packages/quality-metrics/src/gate.ts`

単一 {@link A11yMetric} を tier default threshold (または override) と 突合して pass / fail を判定する helper。 3 impact (critical / serious / moderate) を独立にチェック、 fail 時は impact + actual + threshold + tier を error message に含めて actionable にする (rules/quality.md AC 具体表現)。 mutation tier と異なり、 zero-violation metric (0/0/0) は pass 扱い — a11y は「違反 0 が理想状態」 なので silent success で良い (SSOT: docs/quality/a11y-thresholds.md § 13-axis release gate integration "Empty-violation metrics do not throw")。 `critical` は SSOT invariant で常に 0、 override で 0 以外にできない 型契約は {@link A11yThreshold} の `critical: 0` literal で保証済み。

```ts
export function assertA11yTier(input: {
  metric: A11yMetric;
  tier: A11yTier;
  threshold?: A11yThreshold;
}): void;
```

#### `assertFidelity`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/fidelity-assert.ts#L54) `packages/quality-metrics/src/fidelity-assert.ts`

mock と real を全 case で並走させて結果一致を検証する。 caller は vitest の assertion で `expect(result.divergences).toEqual([])` / `expect(result.ratio).toBe(100)` を書く。 mock or real が throw した case は failed 扱いにする (両方 throw で「両方 fail」 は fidelity 一致とみなさない、 例外の shape が違う可能性があるため)。

```ts
export async function assertFidelity<Args extends unknown[], Result>(
  input: FidelityAssertInput<Args, Result>,
): Promise<FidelityAssertResult>;
```

#### `assertMutationTier`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L64) `packages/quality-metrics/src/gate.ts`

単一 {@link MutationMetric} を tier default threshold (または override) と 突合して pass / fail を判定する helper。 fail 時は actual + threshold + tier を error message に含めて actionable にする (rules/quality.md AC 具体表現)。 `metric.mutations === 0` は「no signal」 として fail 扱い。 空 test suite の 0/0 = 0% が silent pass するのを防ぐ。

```ts
export function assertMutationTier(input: {
  metric: MutationMetric;
  tier: MutationTier;
  threshold?: number;
}): void;
```

#### `captureSnapshot`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/history.ts#L70) `packages/quality-metrics/src/history.ts`

Capture a point-in-time snapshot. Caller passes ISO timestamp + optional label. v0.5 = additive (既存 report 構造は変更しない)。

```ts
export function captureSnapshot(input: {
  report: QualityReport;
  capturedAt: string;
  label?: string;
}): MetricSnapshot;
```

#### `compareToBaseline`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/history.ts#L132) `packages/quality-metrics/src/history.ts`

Compare current snapshot to baseline. Per-axis delta + delta%. 両方 snapshot に共通する axis のみ compare、 片方 のみの axis は skip。

```ts
export function compareToBaseline(input: {
  current: MetricSnapshot;
  baseline: MetricSnapshot;
}): BaselineComparison;
```

#### `costFromSamples`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L134) `packages/quality-metrics/src/collect.ts`

Build a {@link CostMetric} from an array of per-request US$ samples. Returns the arithmetic mean as `perRequestUsd`, sum as `totalUsd`, and the sample count. Empty input yields all-zero.

```ts
export function costFromSamples(samplesUsd: number[]): CostMetric;
```

#### `coverageFromV8Summary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L27) `packages/quality-metrics/src/collect.ts`

Build a {@link CoverageMetric} from a c8 / v8 JSON summary. The input shape mirrors `coverage-summary.json` under c8's default output — the consumer can pass just the `total` block.

```ts
export function coverageFromV8Summary(input: {
  lines: { pct: number };
  branches: { pct: number };
  functions: { pct: number };
}): CoverageMetric;
```

#### `DEFAULT_A11Y_TIER_THRESHOLDS`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L95) `packages/quality-metrics/src/gate.ts`

4-tier a11y (axe-core WCAG 2.1 AA) threshold SSOT — v1.30-4。 各 tier の 3 impact ceiling (critical / serious / moderate) は `docs/quality/a11y-thresholds.md` § Tier table SSOT を写しである。 `critical` は常に 0 (SSOT invariant, "No override may ever raise the critical bar")、 `minor` は release gate 判定外なので閾値表に入れない (team review 用)。 per-package looser override は {@link ReleaseGateContext.a11yTierThreshold} または {@link assertA11yTier} 引数で個別指定する。 stricter override (floor を上げる) は承認不要、 looser override は PR body に one-line justification を残す運用 (SSOT § Overrides)。

```ts
export declare const DEFAULT_A11Y_TIER_THRESHOLDS: Readonly<Record<A11yTier, A11yThreshold>>;
```

#### `DEFAULT_MUTATION_TIER_THRESHOLDS`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L22) `packages/quality-metrics/src/gate.ts`

4-tier mutation kill-rate SSOT — v1.27-4。 各 tier の値は `docs/quality/mutation-thresholds.md` の `high` 列 (green threshold)。 per-package looser override は {@link ReleaseGateContext.mutationTierThreshold} または {@link assertMutationTier} 引数で個別指定する。

```ts
export declare const DEFAULT_MUTATION_TIER_THRESHOLDS: Readonly<Record<MutationTier, number>>;
```

#### `DEFAULT_RELEASE_GATE_THRESHOLDS`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L185) `packages/quality-metrics/src/gate.ts`

Default release-gate thresholds (11 軸)。 共通 7 軸は v1.11 milestone の 業界標準基準、 AI-LLM 4 軸は v1.12 milestone (Issue #695) で新設。 共通 7 軸 (全 provider) ... - coverage 85% line / 80% branch / 90% function - fidelity 70% ratio - perf p95 100ms (unit-scope adapter) - mutation 60% kill rate - behavior test 10 件以上 AI-LLM 4 軸 (`@kiwa-lab/ai-*` provider のみ強制) ... - cost ≤ $0.10 / request (Anthropic / OpenAI 実勢価格帯の bar) - latency p95 ≤ 3000ms (streaming LLM の user-facing bar) - token ≤ 4000 / request (context bloat 検出、 4k model 前提) - accuracy ≥ 0.80 (embedding cosine 0.80 = 意味的に近い bar)

```ts
export declare const DEFAULT_RELEASE_GATE_THRESHOLDS: ReleaseGateThresholds;
```

#### `detectDrift`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/history.ts#L180) `packages/quality-metrics/src/history.ts`

Detect drift from a BaselineComparison. threshold = drift 判定 の 絶対値 delta%、 default 5.0 (5% 以上変動で drift 判定)。 category = axis 別 regression / improvement / stable 集計、 全体 category は regression &gt; 0 なら 'regression'、 improvement &gt; 0 && regression == 0 なら 'improvement'、 他は 'stable'。

```ts
export function detectDrift(input: {
  comparison: BaselineComparison;
  thresholdPct?: number;
}): DriftDetection;
```

#### `diffReports`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/emit.ts#L155) `packages/quality-metrics/src/emit.ts`

Compute a diff between two reports for the same provider. Values are (`current - previous`) so callers can render "improved" / "regressed" labels next to each axis. AI-LLM 4 軸は両 report が該当 field を持つ場合 のみ diff を計算する。

```ts
export function diffReports(previous: QualityReport, current: QualityReport): QualityReportDiff;
```

#### `emitJson`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/emit.ts#L145) `packages/quality-metrics/src/emit.ts`

Emit the report as JSON — the machine-readable counterpart consumers use to persist raw metrics under `docs/quality-reports/`. Pretty-printed with 2-space indentation.

```ts
export function emitJson(report: QualityReport): string;
```

#### `emitMarkdown`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/emit.ts#L11) `packages/quality-metrics/src/emit.ts`

Emit a human-readable markdown report from a {@link QualityReport}. The output shape mirrors what `docs/quality-reports/{package}-{version}.md` consumers expect. When `verdict` is supplied, an additional release-gate section is appended. AI-LLM provider の場合は 4 軸行が追加される。

```ts
export function emitMarkdown(input: {
  report: QualityReport;
  verdict?: ReleaseGateVerdict;
  diff?: QualityReportDiff;
}): string;
```

#### `evaluateReleaseGate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L235) `packages/quality-metrics/src/gate.ts`

Evaluate a report against the release gate. Returns the verdict + a complete list of blockers so callers can render actionable messages. The verdict is `passed = true` when every axis clears its threshold. A partial pass (some axes clear, some fail) still returns `passed = false` because release gate is all-or-nothing. AI-LLM provider (`@kiwa-lab/ai-*`) は共通 7 軸に加えて 4 軸 (cost / latency / token / accuracy) を追加検査、 4 軸のうち report にない field は blocker として扱う (欠損 = 未計測 = 未満)。 それ以外の provider は 7 軸のまま (breaking change なし)。 v1.27-4 で 12 番目 axis `mutation.tier` を optional 追加。 `context.mutationTier` が指定された場合のみ 4-tier threshold (Core 80 / Framework 70 / SaaS 65 / Test type 60) と kill rate を突合、 これは既存 `mutation.killRate` axis と **並存** する (置換ではない)、 legacy overrides もそのまま機能する。 v1.30-4 で 13 番目 axis `a11y.tier` を optional 追加。 `context.a11yTier` が指定された場合のみ 4-tier threshold (Core 0/0/3 / Framework 0/3/10 / SaaS 0/0/0 / Test type 0/3/10) と report.a11y の 3 impact (critical / serious / moderate) を突合、 fail 時は impact 毎に個別 blocker を積む。 report.a11y が undefined の場合は critical Infinity fallback で必ず fail (silent "no data" pass を防止)。 v1.66 で drift 統合 axis 群 `drift.*` を optional 追加。 `context.driftEnabled === true` かつ `context.driftBaseline` 存在時のみ v0.5 の `captureSnapshot` + `compareToBaseline` + `detectDrift` を chain 実行、 regression 検知 axis を `drift.{axis名}` の {@link ReleaseGateBlocker} として 1:1 格上げする。 driftEnabled が false / 省略で default off、 v0.5 までの 11 / 13 axis 動作を 厳密に 維持 (backward compat 絶対維持)。 regressions 数 = drift blocker 数、 axesEvaluated は drift lane を +1 の 単一 lane として 加算 (mutation.tier / a11y.tier と 同一 設計)。

```ts
export function evaluateReleaseGate(
  report: QualityReport,
  overrides: Partial<ReleaseGateThresholds> = {},
  context: ReleaseGateContext = {},
): ReleaseGateVerdict;
```

#### `fidelityFromMethodCounts`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L64) `packages/quality-metrics/src/collect.ts`

Build a {@link FidelityMetric} from the mock-covered method count and the real provider's method count. When `realTotalMethods === 0` the ratio is defined as 100 — a provider with no public methods is trivially covered.

```ts
export function fidelityFromMethodCounts(input: {
  mockCoveredMethods: number;
  realTotalMethods: number;
  behavioralDivergences?: number;
}): FidelityMetric;
```

#### `generateTrendReport`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/history.ts#L213) `packages/quality-metrics/src/history.ts`

Multi-snapshot trend report. snapshots は timeline 昇順で渡す前提。 各 axis の first / last / delta / trend を集計。

```ts
export function generateTrendReport(snapshots: MetricSnapshot[]): TrendReport;
```

#### `isAiLlmProvider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L462) `packages/quality-metrics/src/types.ts`

`@kiwa-lab/ai-*` provider か判定する helper。 release gate と emit が AI-LLM 4 軸の有無を分岐する SSOT。

```ts
export function isAiLlmProvider(provider: string): boolean;
```

#### `latencyFromSamples`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L156) `packages/quality-metrics/src/collect.ts`

Build a {@link LatencyMetric} from an array of raw end-to-end LLM latency samples (ms)。 shape は {@link perfFromSamples} と同一だが、 対象は user-facing LLM response 全体 (streaming 込)。

```ts
export function latencyFromSamples(samplesMs: number[]): LatencyMetric;
```

#### `learnAdaptiveThreshold`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/threshold-learning.ts#L132) `packages/quality-metrics/src/threshold-learning.ts`

v2.1 メイン API = 過去 N snapshot から axis 別 の adaptive threshold を 学習する。 snapshots は timeline 昇順で渡す、 内部で consecutive delta の 分布を計算、 axis 別 mean + stdev から k*stdev 幅 の 推奨 threshold を出力。

```ts
export function learnAdaptiveThreshold(input: {
  snapshots: MetricSnapshot[];
  stdevMultiplier?: number;
  minSampleCount?: number;
}): AdaptiveThresholdReport;
```

#### `mutationFromCounts`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L108) `packages/quality-metrics/src/collect.ts`

Build a {@link MutationMetric} from a mutation total and killed count. Derives `survived` and `killRate` deterministically.

```ts
export function mutationFromCounts(input: {
  mutations: number;
  killed: number;
}): MutationMetric;
```

#### `perfFromSamples`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L94) `packages/quality-metrics/src/collect.ts`

Build a {@link PerfMetric} from an array of raw latency samples in ms. Returns the p50 / p95 / p99 percentiles using nearest-rank on a sorted copy of the samples.

```ts
export function perfFromSamples(samplesMs: number[]): PerfMetric;
```

#### `pickThresholdForAxis`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/threshold-learning.ts#L180) `packages/quality-metrics/src/threshold-learning.ts`

axis 名 が AdaptiveThresholdReport の perAxis に存在すれば 個別 threshold、 存在しなければ aggregate fallback を返す SSOT helper。 evaluateReleaseGate の driftThresholdPct 決定経路 と consumer の per-axis fallback lookup を 統一する。 axis 名 未指定 (undefined) の場合 は aggregate を返す (全体 fallback 用途)。

```ts
export function pickThresholdForAxis(
  report: AdaptiveThresholdReport,
  axis?: string,
): number;
```

#### `resolveA11yTier`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L111) `packages/quality-metrics/src/gate.ts`

baseline JSON の verbal tier label (`Core` / `Framework` / `SaaS` / `Test type`) を machine-friendly {@link A11yTier} enum に正規化する。 baseline (`docs/quality/a11y-thresholds.md`) と runtime gate 経路を 1 経路に集約する SSOT helper。 shape / 動作は {@link resolveMutationTier} と統一 (1 pattern review)。 case-insensitive + trim 対応。 未知 label は throw して silent drift を防ぐ。

```ts
export function resolveA11yTier(label: string): A11yTier;
```

#### `resolveMutationTier`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L37) `packages/quality-metrics/src/gate.ts`

baseline JSON の verbal tier label (`Core` / `Framework` / `SaaS` / `Test type`) を machine-friendly {@link MutationTier} enum に正規化する。 baseline (`docs/quality/mutation-thresholds.md`) と runtime gate 経路を 1 経路に集約する SSOT helper。 case-insensitive + trim 対応。 未知 label は throw して silent drift を防ぐ。

```ts
export function resolveMutationTier(label: string): MutationTier;
```

#### `resolveRealFidelityMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/real-fidelity-gate.ts#L64) `packages/quality-metrics/src/real-fidelity-gate.ts`

KIWA_MODE=real env + 必須 env keys 存在の 2 条件を確認、 real driver 経路の 有効化判定を返す。 test file 冒頭で `resolveRealFidelityMode(...).enabled` を `describe.skipIf` / `it.skipIf` に渡して条件付き skip する用途。 default (KIWA_MODE 未設定 or "mock") = disabled + skipReason='kiwa-mode-not-real:mock'。 KIWA_MODE=real + 必須 env 全 set = enabled=true。 KIWA_MODE=real + 必須 env 1 件以上 missing = disabled + skipReason='env-missing:...'。

```ts
export function resolveRealFidelityMode(
  input: RealFidelityGateInput,
): RealFidelityGateResult;
```

#### `testCountFromCategories`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L43) `packages/quality-metrics/src/collect.ts`

Build a {@link TestCountMetric} from three counts, computing the sum. Callers usually pull these numbers from the vitest reporter output.

```ts
export function testCountFromCategories(input: {
  behavior: number;
  integration: number;
  e2e: number;
}): TestCountMetric;
```

#### `tokenFromSamples`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L170) `packages/quality-metrics/src/collect.ts`

Build a {@link TokenMetric} from parallel arrays of prompt / completion token samples。 両 array の長さは一致必須、 request 数 = 配列長。

```ts
export function tokenFromSamples(input: {
  promptTokens: number[];
  completionTokens: number[];
}): TokenMetric;
```

### 型

#### `A11yMetric`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L156) `packages/quality-metrics/src/types.ts`

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

#### `A11yThreshold`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L189) `packages/quality-metrics/src/types.ts`

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

#### `A11yTier`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L180) `packages/quality-metrics/src/types.ts`

4-tier a11y threshold classification — v1.30-4 SSOT。 shape / 意味は {@link MutationTier} と統一 (SSOT: docs/quality/a11y-thresholds.md § Tier table)。 - `core` = pure logic packages with no DOM output (bar 0/0/3) - `framework` = SSR / hydration / adapter wrapper (bar 0/3/10) - `saas` = provider-specific adapter (bar 0/0/0, strict) - `test-type` = test harness with DOM measurement noise (bar 0/3/10) baseline JSON (`docs/quality/a11y-thresholds.md` に verbal `Core` / `Framework` / `SaaS` / `Test type` で書かれる) は {@link resolveA11yTier } で本 enum に正規化する。

```ts
export type A11yTier = 'core' | 'framework' | 'saas' | 'test-type';
```

#### `AccuracyMetric`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L255) `packages/quality-metrics/src/types.ts`

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

#### `AdaptiveThreshold`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/threshold-learning.ts#L27) `packages/quality-metrics/src/threshold-learning.ts`

axis 別 の adaptive threshold 学習結果。 mean + stdev + sampleCount で 学習 の 統計的信頼性 を verify 可能、 recommendedThresholdPct が最終出力。

```ts
export interface AdaptiveThreshold {
  axis: string;
  sampleCount: number;
  meanDeltaPct: number;
  stdevDeltaPct: number;
  /** mean + k * stdev の絶対値、 k は input.stdevMultiplier (default 2)。 */
  recommendedThresholdPct: number;
}
```

#### `AdaptiveThresholdReport`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/threshold-learning.ts#L37) `packages/quality-metrics/src/threshold-learning.ts`

全 axis 分 の 学習結果集計。 axis 名 → AdaptiveThreshold の map と 平均値。

```ts
export interface AdaptiveThresholdReport {
  perAxis: Record<string, AdaptiveThreshold>;
  /** 全 axis 平均 recommendedThresholdPct、 fallback threshold として使う。 */
  aggregateThresholdPct: number;
  usedSnapshotCount: number;
}
```

#### `AxisDelta`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/history.ts#L25) `packages/quality-metrics/src/history.ts`

Per-axis delta between current and baseline.

```ts
export interface AxisDelta {
  axis: string;
  currentValue: number;
  baselineValue: number;
  delta: number;
  deltaPct: number;
}
```

#### `BaselineComparison`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/history.ts#L34) `packages/quality-metrics/src/history.ts`

Comparison between current snapshot and baseline snapshot.

```ts
export interface BaselineComparison {
  currentLabel: string | null;
  baselineLabel: string | null;
  axisDeltas: AxisDelta[];
}
```

#### `CostMetric`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L205) `packages/quality-metrics/src/types.ts`

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

#### `CoverageMetric`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L41) `packages/quality-metrics/src/types.ts`

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

#### `DriftCategory`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/history.ts#L41) `packages/quality-metrics/src/history.ts`

Drift detection verdict category.

```ts
export type DriftCategory = 'regression' | 'improvement' | 'stable';
```

#### `DriftDetection`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/history.ts#L44) `packages/quality-metrics/src/history.ts`

Drift detection result for a single comparison.

```ts
export interface DriftDetection {
  category: DriftCategory;
  regressions: AxisDelta[];
  improvements: AxisDelta[];
  stable: AxisDelta[];
  threshold: number;
}
```

#### `EnvSource`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/real-fidelity-gate.ts#L19) `packages/quality-metrics/src/real-fidelity-gate.ts`

env 参照 source (test 経路で override 可能)。 default = process.env。

```ts
export interface EnvSource {
  [key: string]: string | undefined;
}
```

#### `FidelityAssertInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/fidelity-assert.ts#L41) `packages/quality-metrics/src/fidelity-assert.ts`

```ts
export interface FidelityAssertInput<Args extends unknown[] = unknown[], Result = unknown> {
  mockFn: (...args: Args) => Promise<Result> | Result;
  realFn: (...args: Args) => Promise<Result> | Result;
  cases: FidelityCase<Args, Result>[];
}
```

#### `FidelityAssertResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/fidelity-assert.ts#L33) `packages/quality-metrics/src/fidelity-assert.ts`

```ts
export interface FidelityAssertResult {
  passed: number;
  failed: number;
  /** passed / (passed + failed) * 100。 0-case でも NaN 回避で 100 を返す。 */
  ratio: number;
  divergences: FidelityDivergence[];
}
```

#### `FidelityCase`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/fidelity-assert.ts#L16) `packages/quality-metrics/src/fidelity-assert.ts`

1 fidelity case = 1 引数 tuple + 期待される mock ↔ real 一致挙動。

```ts
export interface FidelityCase<Args extends unknown[] = unknown[], Result = unknown> {
  name: string;
  args: Args;
  /**
   * 独自比較関数。 default = deepStrictEqual。 order-insensitive な set 比較や、
   * 特定 field を無視したい (例 timestamp / uuid) 場合は本 field で override する。
   */
  compare?: (mock: Result, real: Result) => boolean;
}
```

#### `FidelityDivergence`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/fidelity-assert.ts#L26) `packages/quality-metrics/src/fidelity-assert.ts`

```ts
export interface FidelityDivergence {
  case: string;
  mock: unknown;
  real: unknown;
  reason: string;
}
```

#### `FidelityMetric`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L80) `packages/quality-metrics/src/types.ts`

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

#### `LatencyMetric`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L221) `packages/quality-metrics/src/types.ts`

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

#### `MetricSnapshot`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/history.ts#L15) `packages/quality-metrics/src/history.ts`

Time-point snapshot of QualityReport with fixed timestamp label.

```ts
export interface MetricSnapshot {
  /** ISO 8601 timestamp for the snapshot (caller-provided). */
  capturedAt: string;
  /** Optional label (e.g., "release-v1.65", "main-2026-07-08"). */
  label: string | null;
  /** Full quality report at capture time. */
  report: QualityReport;
}
```

#### `MutationMetric`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L121) `packages/quality-metrics/src/types.ts`

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

#### `MutationTier`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L144) `packages/quality-metrics/src/types.ts`

4-tier mutation threshold classification — v1.27-4 SSOT。 `core` = pure logic (deterministic tests、 no framework noise)、 `framework` = SSR / hydration / adapter drift、 `saas` = provider-specific adapter (external API drift 前提)、 `test-type` = DOM / browser noise を含む harness package。 baseline JSON (`docs/quality/mutation-thresholds.md` に verbal `Core` / `Framework` / `SaaS` / `Test type` で書かれる) は {@link resolveMutationTier } で本 enum に正規化する。

```ts
export type MutationTier = 'core' | 'framework' | 'saas' | 'test-type';
```

#### `PerfMetric`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L96) `packages/quality-metrics/src/types.ts`

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

#### `QualityReport`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L273) `packages/quality-metrics/src/types.ts`

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

#### `QualityReportDiff`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L440) `packages/quality-metrics/src/types.ts`

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

#### `RealFidelityGateInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/real-fidelity-gate.ts#L24) `packages/quality-metrics/src/real-fidelity-gate.ts`

1 real fidelity gate 判定 input。

```ts
export interface RealFidelityGateInput {
  /**
   * lib 名 (エラー message / log 用の識別子)。 例 = 'cache' / 'auth' / 'payment'。
   */
  readonly lib: string;
  /**
   * real driver 経路が要求する env keys (SSOT)。 例 = ['REDIS_URL'] / ['STRIPE_SECRET_KEY']。
   * 全 key が set されている時のみ enabled。 1 件でも missing なら mock fallback。
   */
  readonly requiredEnvKeys: readonly string[];
  /**
   * env 参照 source override。 test 経路で `envSource: { KIWA_MODE: 'real', ... }` を
   * 明示注入する用途。 default = process.env。
   */
  readonly envSource?: EnvSource;
}
```

#### `RealFidelityGateResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/real-fidelity-gate.ts#L42) `packages/quality-metrics/src/real-fidelity-gate.ts`

gate 判定結果。

```ts
export interface RealFidelityGateResult {
  /** true = real driver 有効、 false = mock fallback。 */
  readonly enabled: boolean;
  /**
   * skip 理由 (enabled=false 時のみ)。 pattern。
   *   - `kiwa-mode-not-real:<mode>` = KIWA_MODE が "real" 以外
   *   - `env-missing:<key1>,<key2>` = 必須 env keys 不足
   */
  readonly skipReason?: string;
  /** enabled=false 時、 何の key が missing か (debug 用)。 */
  readonly missingKeys: readonly string[];
}
```

#### `ReleaseGateBlocker`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L343) `packages/quality-metrics/src/types.ts`

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

#### `ReleaseGateContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L379) `packages/quality-metrics/src/types.ts`

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

#### `ReleaseGateThresholds`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L305) `packages/quality-metrics/src/types.ts`

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

#### `ReleaseGateVerdict`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L358) `packages/quality-metrics/src/types.ts`

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

#### `TestCountMetric`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L51) `packages/quality-metrics/src/types.ts`

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

#### `TokenMetric`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts#L239) `packages/quality-metrics/src/types.ts`

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

#### `TrendReport`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/history.ts#L53) `packages/quality-metrics/src/history.ts`

Trend statistics across multiple snapshots.

```ts
export interface TrendReport {
  snapshotCount: number;
  firstLabel: string | null;
  lastLabel: string | null;
  axisSummary: {
    axis: string;
    first: number;
    last: number;
    delta: number;
    trend: 'up' | 'down' | 'flat';
  }[];
}
```
<!-- kiwa-public-api:end -->
