---
title: "@kiwa-lab/observability types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/observability</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)



### 型

#### <code v-pre>DashboardInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/types.ts#L32) <code v-pre>packages/observability/src/types.ts</code>

```ts
export interface DashboardInput {
    history: RunHistory;
    flaky: FlakyTest[];
    gaps: SpecCoverageGap[];
    coverage?: import('./coverage.js').CoverageSummary;
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
