---
title: "@kiwa-lab/observability coverage の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/observability</code> <code v-pre>coverage</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>checkThresholds</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts#L109) <code v-pre>packages/observability/src/coverage.ts</code>

```ts
export declare function checkThresholds(summary: CoverageSummary, thresholds: CoverageThresholds): ThresholdCheckResult;
```

#### <code v-pre>fromIstanbulCoverageSummary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts#L74) <code v-pre>packages/observability/src/coverage.ts</code>

```ts
export declare function fromIstanbulCoverageSummary(raw: IstanbulCoverageSummary): CoverageSummary;
```

### 型

#### <code v-pre>CoverageFileEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts#L8) <code v-pre>packages/observability/src/coverage.ts</code>

```ts
export interface CoverageFileEntry {
    path: string;
    statements: CoverageMetric;
    branches: CoverageMetric;
    functions: CoverageMetric;
    lines: CoverageMetric;
}
```

#### <code v-pre>CoverageMetric</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts#L1) <code v-pre>packages/observability/src/coverage.ts</code>

```ts
export interface CoverageMetric {
    total: number;
    covered: number;
    skipped: number;
    pct: number;
}
```

#### <code v-pre>CoverageSummary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts#L16) <code v-pre>packages/observability/src/coverage.ts</code>

```ts
export interface CoverageSummary {
    total: CoverageFileEntry;
    files: CoverageFileEntry[];
}
```

#### <code v-pre>CoverageThresholds</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts#L97) <code v-pre>packages/observability/src/coverage.ts</code>

```ts
export interface CoverageThresholds {
    statements?: number;
    branches?: number;
    functions?: number;
    lines?: number;
}
```

#### <code v-pre>IstanbulCoverageSummary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts#L35) <code v-pre>packages/observability/src/coverage.ts</code>

```ts
export type IstanbulCoverageSummary = Record<string, IstanbulFileSummary>;
```

#### <code v-pre>ThresholdCheckResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts#L104) <code v-pre>packages/observability/src/coverage.ts</code>

```ts
export interface ThresholdCheckResult {
    ok: boolean;
    failures: Array<{
        metric: keyof CoverageThresholds;
        required: number;
        actual: number;
    }>;
}
```
