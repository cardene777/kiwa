---
title: "@kiwa-lab/quality-metrics collect の API 契約"
---

# <code v-pre>@kiwa-lab/quality-metrics</code> <code v-pre>collect</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>a11yFromBaseline</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L236) <code v-pre>packages/quality-metrics/src/collect.ts</code>

Build an {@link A11yMetric} from a `.a11y-baseline/{pkg}.json` `totals` block (v1.30-4)。 baseline JSON は `{ package, generatedAt, layers, totals: { critical, serious, moderate, minor }, ok }` shape、 このヘルパは totals を A11yMetric 型に coerce する pure function。 層が全部 layers-absent (Core / Framework の no-DOM adapter) の baseline は 全 impact が 0 になる、 その場合も metric は shape 通り返す (release gate が 0/0/0 を pass 判定する SSOT)。 部分欠損 (`totals: { critical: 0 }` のみ等) は 0 default で埋める、 silent NaN / undefined を防ぐ (負値 / NaN は throw で拒否)。

```ts
export declare function a11yFromBaseline(input: {
    totals: {
        critical?: number;
        serious?: number;
        moderate?: number;
        minor?: number;
    };
}): A11yMetric;
```

#### <code v-pre>accuracyFromSamples</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L200) <code v-pre>packages/quality-metrics/src/collect.ts</code>

Build an {@link AccuracyMetric} from an array of 0.0-1.0 similarity samples。 `method` field で「どの計測方法か」 を明示 (cosine / bleu / exact-match / custom)、 score は平均。

```ts
export declare function accuracyFromSamples(input: {
    samples: number[];
    method: string;
}): AccuracyMetric;
```

#### <code v-pre>assembleReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L270) <code v-pre>packages/quality-metrics/src/collect.ts</code>

Assemble a full {@link QualityReport} from pre-computed axes. Fills the `reportedAt` timestamp with the current UTC ISO string. AI-LLM 4 軸 (cost / latency / token / accuracy) は provider が `@kiwa-lab/ai-*` のときのみ意味を持つ (それ以外は undefined でも通る)。 a11y 軸 (v1.30-4) は tier-aware release gate が有効な package のみ渡す、 未渡しは release gate 判定外 (context.a11yTier 指定時に critical Infinity fallback で fail-safe)。

```ts
export declare function assembleReport(input: {
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

#### <code v-pre>costFromSamples</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L134) <code v-pre>packages/quality-metrics/src/collect.ts</code>

Build a {@link CostMetric} from an array of per-request US$ samples. Returns the arithmetic mean as `perRequestUsd`, sum as `totalUsd`, and the sample count. Empty input yields all-zero.

```ts
export declare function costFromSamples(samplesUsd: number[]): CostMetric;
```

#### <code v-pre>coverageFromV8Summary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L27) <code v-pre>packages/quality-metrics/src/collect.ts</code>

Build a {@link CoverageMetric} from a c8 / v8 JSON summary. The input shape mirrors `coverage-summary.json` under c8's default output — the consumer can pass just the `total` block.

```ts
export declare function coverageFromV8Summary(input: {
    lines: {
        pct: number;
    };
    branches: {
        pct: number;
    };
    functions: {
        pct: number;
    };
}): CoverageMetric;
```

#### <code v-pre>fidelityFromMethodCounts</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L64) <code v-pre>packages/quality-metrics/src/collect.ts</code>

Build a {@link FidelityMetric} from the mock-covered method count and the real provider's method count. When `realTotalMethods === 0` the ratio is defined as 100 — a provider with no public methods is trivially covered.

```ts
export declare function fidelityFromMethodCounts(input: {
    mockCoveredMethods: number;
    realTotalMethods: number;
    behavioralDivergences?: number;
}): FidelityMetric;
```

#### <code v-pre>latencyFromSamples</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L156) <code v-pre>packages/quality-metrics/src/collect.ts</code>

Build a {@link LatencyMetric} from an array of raw end-to-end LLM latency samples (ms)。 shape は {@link perfFromSamples} と同一だが、 対象は user-facing LLM response 全体 (streaming 込)。

```ts
export declare function latencyFromSamples(samplesMs: number[]): LatencyMetric;
```

#### <code v-pre>mutationFromCounts</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L108) <code v-pre>packages/quality-metrics/src/collect.ts</code>

Build a {@link MutationMetric} from a mutation total and killed count. Derives `survived` and `killRate` deterministically.

```ts
export declare function mutationFromCounts(input: {
    mutations: number;
    killed: number;
}): MutationMetric;
```

#### <code v-pre>perfFromSamples</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L94) <code v-pre>packages/quality-metrics/src/collect.ts</code>

Build a {@link PerfMetric} from an array of raw latency samples in ms. Returns the p50 / p95 / p99 percentiles using nearest-rank on a sorted copy of the samples.

```ts
export declare function perfFromSamples(samplesMs: number[]): PerfMetric;
```

#### <code v-pre>testCountFromCategories</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L43) <code v-pre>packages/quality-metrics/src/collect.ts</code>

Build a {@link TestCountMetric} from three counts, computing the sum. Callers usually pull these numbers from the vitest reporter output.

```ts
export declare function testCountFromCategories(input: {
    behavior: number;
    integration: number;
    e2e: number;
}): TestCountMetric;
```

#### <code v-pre>tokenFromSamples</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L170) <code v-pre>packages/quality-metrics/src/collect.ts</code>

Build a {@link TokenMetric} from parallel arrays of prompt / completion token samples。 両 array の長さは一致必須、 request 数 = 配列長。

```ts
export declare function tokenFromSamples(input: {
    promptTokens: number[];
    completionTokens: number[];
}): TokenMetric;
```


