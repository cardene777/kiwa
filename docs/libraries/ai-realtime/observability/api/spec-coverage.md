---
title: "@kiwa-lab/observability spec-coverage の API 契約"
---

# <code v-pre>@kiwa-lab/observability</code> <code v-pre>spec-coverage</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/spec-coverage.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>analyzeSpecCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/spec-coverage.ts#L21) <code v-pre>packages/observability/src/spec-coverage.ts</code>

```ts
export declare function analyzeSpecCoverage(opts: AnalyzeSpecCoverageOptions): SpecCoverageGap;
```

### 型

#### <code v-pre>AnalyzeSpecCoverageOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/spec-coverage.ts#L6) <code v-pre>packages/observability/src/spec-coverage.ts</code>

```ts
export interface AnalyzeSpecCoverageOptions {
    specMarkdown: string;
    testCode: string;
    module?: string;
    defaultLayer?: 'contract' | 'unit' | 'integration' | 'e2e' | 'api' | 'ui' | 'data' | 'cli';
}
```
