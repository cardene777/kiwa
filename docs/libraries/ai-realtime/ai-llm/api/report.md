---
title: "@kiwa-lab/ai-llm report の API 契約"
---

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>report</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/report.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>buildAiLlmReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/report.ts#L59) <code v-pre>packages/ai-llm/src/report.ts</code>

実測 fidelity + coverage + test count + mutation + perf を `QualityReport` に統合する。 AI-LLM 4 軸は `fidelity.records` から 自動集計。

```ts
export declare function buildAiLlmReport(input: BuildAiLlmReportInput): QualityReport;
```

#### <code v-pre>buildAiLlmReportFromMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/report.ts#L106) <code v-pre>packages/ai-llm/src/report.ts</code>

mock adapter の `getMetrics()` から直接 `QualityReport` を組み立てる light path。 fidelity harness を回さず、 mock 単体の実測値だけを report 化する用途 (unit test 内で release gate 検証したいとき等)。

```ts
export declare function buildAiLlmReportFromMock(input: {
    provider: string;
    version: string;
    mock: AiLlmMock;
    /** accuracy は fidelity 経路が必要なので単体経路では固定値を渡す。 */
    accuracyScore: number;
    accuracyMethod: string;
    surfaceCoverage?: {
        mockCoveredMethods: number;
        realTotalMethods: number;
    };
    testCount?: {
        behavior: number;
        integration: number;
        e2e: number;
    };
    notes?: string;
}): QualityReport;
```

### 型

#### <code v-pre>BuildAiLlmReportInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/report.ts#L28) <code v-pre>packages/ai-llm/src/report.ts</code>

`@kiwa-lab/ai-llm` 実測値を `@kiwa-lab/quality-metrics` `QualityReport` に集約する adapter。 dogfood app が fidelity harness を回した後、 本 adapter で `QualityReport` に変換 → `evaluateReleaseGate` に渡す、 の流れを想定。 accuracy / cost / latency / token 4 軸は `FidelityReport.records` の 実測値 (mock 側) を集計、 fidelity の 5 軸目 (surface coverage) は 別途 mock 側の `mockCoveredMethods` / `realTotalMethods` 引数で指定。

```ts
export interface BuildAiLlmReportInput {
    provider: string;
    version: string;
    /** fidelity harness の結果 (real vs mock 4 metric 実測) */
    fidelity: FidelityReport;
    /**
     * mock 側 SDK 表面の cover 数。 `@kiwa-lab/quality-metrics` 5 軸目の
     * fidelity ratio 用。 default `{ mock: 4, real: 4 }` (4 SDK 全 cover)。
     */
    surfaceCoverage?: {
        mockCoveredMethods: number;
        realTotalMethods: number;
    };
    /** vitest 由来の test count breakdown。 */
    testCount?: {
        behavior: number;
        integration: number;
        e2e: number;
    };
    /** v8 coverage summary (c8 `coverage-summary.json` の `total` block)。 */
    coverageV8Summary?: {
        lines: {
            pct: number;
        };
        branches: {
            pct: number;
        };
        functions: {
            pct: number;
        };
    };
    /** stryker / cargo-mutants mutation report。 */
    mutation?: {
        mutations: number;
        killed: number;
    };
    /** unit-scope adapter perf (100 回計測の p95 用)。 */
    perfSamplesMs?: number[];
    /** notes to embed in the emitted markdown report。 */
    notes?: string;
}
```
