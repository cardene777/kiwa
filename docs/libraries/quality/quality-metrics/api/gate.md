---
title: "@kiwa-lab/quality-metrics gate の API 契約"
---

# <code v-pre>@kiwa-lab/quality-metrics</code> <code v-pre>gate</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>assertA11yTier</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L144) <code v-pre>packages/quality-metrics/src/gate.ts</code>

単一 {@link A11yMetric} を tier default threshold (または override) と 突合して pass / fail を判定する helper。 3 impact (critical / serious / moderate) を独立にチェック、 fail 時は impact + actual + threshold + tier を error message に含めて actionable にする (rules/quality.md AC 具体表現)。 mutation tier と異なり、 zero-violation metric (0/0/0) は pass 扱い — a11y は「違反 0 が理想状態」 なので silent success で良い (SSOT: docs/quality/a11y-thresholds.md § 13-axis release gate integration "Empty-violation metrics do not throw")。 `critical` は SSOT invariant で常に 0、 override で 0 以外にできない 型契約は {@link A11yThreshold} の `critical: 0` literal で保証済み。

```ts
export declare function assertA11yTier(input: {
    metric: A11yMetric;
    tier: A11yTier;
    threshold?: A11yThreshold;
}): void;
```

#### <code v-pre>assertMutationTier</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L64) <code v-pre>packages/quality-metrics/src/gate.ts</code>

単一 {@link MutationMetric} を tier default threshold (または override) と 突合して pass / fail を判定する helper。 fail 時は actual + threshold + tier を error message に含めて actionable にする (rules/quality.md AC 具体表現)。 `metric.mutations === 0` は「no signal」 として fail 扱い。 空 test suite の 0/0 = 0% が silent pass するのを防ぐ。

```ts
export declare function assertMutationTier(input: {
    metric: MutationMetric;
    tier: MutationTier;
    threshold?: number;
}): void;
```

#### <code v-pre>DEFAULT&#95;A11Y&#95;TIER&#95;THRESHOLDS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L95) <code v-pre>packages/quality-metrics/src/gate.ts</code>

4-tier a11y (axe-core WCAG 2.1 AA) threshold SSOT — v1.30-4。 各 tier の 3 impact ceiling (critical / serious / moderate) は `docs/quality/a11y-thresholds.md` § Tier table SSOT を写しである。 `critical` は常に 0 (SSOT invariant, "No override may ever raise the critical bar")、 `minor` は release gate 判定外なので閾値表に入れない (team review 用)。 per-package looser override は {@link ReleaseGateContext.a11yTierThreshold} または {@link assertA11yTier} 引数で個別指定する。 stricter override (floor を上げる) は承認不要、 looser override は PR body に one-line justification を残す運用 (SSOT § Overrides)。

```ts
export declare const DEFAULT_A11Y_TIER_THRESHOLDS: Readonly<Record<A11yTier, A11yThreshold>>;
```

#### <code v-pre>DEFAULT&#95;MUTATION&#95;TIER&#95;THRESHOLDS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L22) <code v-pre>packages/quality-metrics/src/gate.ts</code>

4-tier mutation kill-rate SSOT — v1.27-4。 各 tier の値は `docs/quality/mutation-thresholds.md` の `high` 列 (green threshold)。 per-package looser override は {@link ReleaseGateContext.mutationTierThreshold} または {@link assertMutationTier} 引数で個別指定する。

```ts
export declare const DEFAULT_MUTATION_TIER_THRESHOLDS: Readonly<Record<MutationTier, number>>;
```

#### <code v-pre>DEFAULT&#95;RELEASE&#95;GATE&#95;THRESHOLDS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L185) <code v-pre>packages/quality-metrics/src/gate.ts</code>

Default release-gate thresholds (11 軸)。 共通 7 軸は v1.11 milestone の 業界標準基準、 AI-LLM 4 軸は v1.12 milestone (Issue #695) で新設。 共通 7 軸 (全 provider) ... - coverage 85% line / 80% branch / 90% function - fidelity 70% ratio - perf p95 100ms (unit-scope adapter) - mutation 60% kill rate - behavior test 10 件以上 AI-LLM 4 軸 (`@kiwa-lab/ai-*` provider のみ強制) ... - cost ≤ $0.10 / request (Anthropic / OpenAI 実勢価格帯の bar) - latency p95 ≤ 3000ms (streaming LLM の user-facing bar) - token ≤ 4000 / request (context bloat 検出、 4k model 前提) - accuracy ≥ 0.80 (embedding cosine 0.80 = 意味的に近い bar)

```ts
export declare const DEFAULT_RELEASE_GATE_THRESHOLDS: ReleaseGateThresholds;
```

#### <code v-pre>evaluateReleaseGate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L235) <code v-pre>packages/quality-metrics/src/gate.ts</code>

Evaluate a report against the release gate. Returns the verdict + a complete list of blockers so callers can render actionable messages. The verdict is `passed = true` when every axis clears its threshold. A partial pass (some axes clear, some fail) still returns `passed = false` because release gate is all-or-nothing. AI-LLM provider (`@kiwa-lab/ai-*`) は共通 7 軸に加えて 4 軸 (cost / latency / token / accuracy) を追加検査、 4 軸のうち report にない field は blocker として扱う (欠損 = 未計測 = 未満)。 それ以外の provider は 7 軸のまま (breaking change なし)。 v1.27-4 で 12 番目 axis `mutation.tier` を optional 追加。 `context.mutationTier` が指定された場合のみ 4-tier threshold (Core 80 / Framework 70 / SaaS 65 / Test type 60) と kill rate を突合、 これは既存 `mutation.killRate` axis と **並存** する (置換ではない)、 legacy overrides もそのまま機能する。 v1.30-4 で 13 番目 axis `a11y.tier` を optional 追加。 `context.a11yTier` が指定された場合のみ 4-tier threshold (Core 0/0/3 / Framework 0/3/10 / SaaS 0/0/0 / Test type 0/3/10) と report.a11y の 3 impact (critical / serious / moderate) を突合、 fail 時は impact 毎に個別 blocker を積む。 report.a11y が undefined の場合は critical Infinity fallback で必ず fail (silent "no data" pass を防止)。 v1.66 で drift 統合 axis 群 `drift.*` を optional 追加。 `context.driftEnabled === true` かつ `context.driftBaseline` 存在時のみ v0.5 の `captureSnapshot` + `compareToBaseline` + `detectDrift` を chain 実行、 regression 検知 axis を `drift.{axis名}` の {@link ReleaseGateBlocker} として 1:1 格上げする。 driftEnabled が false / 省略で default off、 v0.5 までの 11 / 13 axis 動作を 厳密に 維持 (backward compat 絶対維持)。 regressions 数 = drift blocker 数、 axesEvaluated は drift lane を +1 の 単一 lane として 加算 (mutation.tier / a11y.tier と 同一 設計)。

```ts
export declare function evaluateReleaseGate(report: QualityReport, overrides?: Partial<ReleaseGateThresholds>, context?: ReleaseGateContext): ReleaseGateVerdict;
```

#### <code v-pre>resolveA11yTier</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L111) <code v-pre>packages/quality-metrics/src/gate.ts</code>

baseline JSON の verbal tier label (`Core` / `Framework` / `SaaS` / `Test type`) を machine-friendly {@link A11yTier} enum に正規化する。 baseline (`docs/quality/a11y-thresholds.md`) と runtime gate 経路を 1 経路に集約する SSOT helper。 shape / 動作は {@link resolveMutationTier} と統一 (1 pattern review)。 case-insensitive + trim 対応。 未知 label は throw して silent drift を防ぐ。

```ts
export declare function resolveA11yTier(label: string): A11yTier;
```

#### <code v-pre>resolveMutationTier</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L37) <code v-pre>packages/quality-metrics/src/gate.ts</code>

baseline JSON の verbal tier label (`Core` / `Framework` / `SaaS` / `Test type`) を machine-friendly {@link MutationTier} enum に正規化する。 baseline (`docs/quality/mutation-thresholds.md`) と runtime gate 経路を 1 経路に集約する SSOT helper。 case-insensitive + trim 対応。 未知 label は throw して silent drift を防ぐ。

```ts
export declare function resolveMutationTier(label: string): MutationTier;
```


