---
title: "@kiwa-lab/observability types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/observability</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)



### 型

#### <code v-pre>DashboardInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/types.ts#L41) <code v-pre>packages/observability/src/types.ts</code>

```ts
export interface DashboardInput {
    history: RunHistory;
    /** Execution time section に出す遅い test の件数。 既定 5。 */
    slowestLimit?: number;
    flaky: FlakyTest[];
    gaps: SpecCoverageGap[];
    coverage?: import('./coverage.js').CoverageSummary;
    /**
     * flaky の判定に使った history (累積)。
     *
     * `history` は **この run** を表し、 Summary はそれを数える。 累積を Summary に渡すと、
     * この run が 0 件でも過去の record だけで `pass rate` が出て、 走らせていない状態が
     * 成功に見える (#1909 で禁じた形)。
     *
     * 一方 flaky は 1 run では判定できないため、 判定材料は累積側で数える。 省略時は
     * `history` を使う (単発の呼出はこれまでどおり動く)。
     */
    flakyHistory?: RunHistory;
    /**
     * `detectFlaky` に渡したのと同じ `minRuns`。
     *
     * 表示が「判定した上で無い」 と「判定していない」 を分けるのに要る。 省くと
     * `detectFlaky` と同じ既定 (`DEFAULT_FLAKY_MIN_RUNS`) を使う = 呼出側が既定の
     * ままなら渡さなくても一致する。 **別の値を渡した時は必ずここにも渡す**。
     */
    flakyMinRuns?: number;
}
```

#### <code v-pre>FlakyTest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/types.ts#L16) <code v-pre>packages/observability/src/types.ts</code>

```ts
export interface FlakyTest {
    testId: string;
    fullName: string;
    totalRuns: number;
    passes: number;
    failures: number;
    failureRate: number;
}
```

#### <code v-pre>RunHistory</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/types.ts#L12) <code v-pre>packages/observability/src/types.ts</code>

```ts
export interface RunHistory {
    records: TestRunRecord[];
}
```

#### <code v-pre>SpecCoverageGap</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/types.ts#L25) <code v-pre>packages/observability/src/types.ts</code>

```ts
export interface SpecCoverageGap {
    module: string;
    layer: string;
    missingTcIds: string[];
    extraTcIds: string[];
    /**
     * spec から読めた case の件数。
     *
     * 2 つの id 配列だけでは「解析できた上で一致した」 と「1 件も解析できなかった」 が
     * 区別できない。 どちらも両方空になり、 dashboard は同じ文字列を出す (実測、 #1910)。
     * 件数は読み手が区別するための唯一の材料で、 0 件は gap が無いことではなく
     * 突き合わせが成立していないことを意味する。
     */
    specCaseCount: number;
}
```

#### <code v-pre>TestRunRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/types.ts#L3) <code v-pre>packages/observability/src/types.ts</code>

```ts
export interface TestRunRecord {
    testId: string;
    fullName: string;
    status: TestStatus;
    durationMs: number;
    runId: string;
    startedAt: number;
}
```

#### <code v-pre>TestStatus</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/types.ts#L1) <code v-pre>packages/observability/src/types.ts</code>

```ts
export type TestStatus = 'passed' | 'failed' | 'skipped';
```
