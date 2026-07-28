---
title: "@kiwa-lab/realtime report の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>report</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/report.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>buildRealtimeReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/report.ts#L62) <code v-pre>packages/realtime/src/report.ts</code>

実測 fidelity + coverage + test count + mutation + perf を `QualityReport` に統合する。 Realtime 4 軸は fidelity + mockMetrics から 自動集計。

```ts
export declare function buildRealtimeReport(input: BuildRealtimeReportInput): QualityReport;
```

### 型

#### <code v-pre>BuildRealtimeReportInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/report.ts#L31) <code v-pre>packages/realtime/src/report.ts</code>

`@kiwa-lab/realtime` 実測値を `@kiwa-lab/quality-metrics` `QualityReport` に集約する adapter。 dogfood app が realtime fidelity harness を回した後、 本 adapter で `QualityReport` に変換 → `evaluateReleaseGate` に渡す、 の流れを想定。 Realtime は cost / token が LLM ほど直接的でないため、 - cost = mock 側の subscribe + publish 総回数 × 単価 (通信費近似) - latency = subscribe + publish latency サンプル - token = event payload の byte 数を token 相当として扱う - accuracy = fidelity harness の kind/payload 一致率 の 4 軸に mapping する。

```ts
export interface BuildRealtimeReportInput {
    provider: string;
    version: string;
    /** fidelity harness の結果 (real vs mock scenario 一致率) */
    fidelity: RealtimeFidelityReport;
    /** mock 実測 metrics (cost / latency 集計用)。 */
    mockMetrics: ReturnType<RealtimeMock['getMetrics']>;
    /** mock 側 API 表面 cover 数。 default `{ mock: 4, real: 4 }` (4 provider)。 */
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
    /** v8 coverage summary。 */
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
    /** stryker / mutation テスト結果。 */
    mutation?: {
        mutations: number;
        killed: number;
    };
    /** perf sample (ms、 別軸 p95 用)。 */
    perfSamplesMs?: number[];
    /** 1 event あたりの想定通信費 (USD、 default $0.00001 = $10/million events)。 */
    costPerEventUsd?: number;
    notes?: string;
}
```
