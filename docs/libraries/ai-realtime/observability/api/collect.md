---
title: "@kiwa-lab/observability collect の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/observability</code> <code v-pre>collect</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>collectRunHistory</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L12) <code v-pre>packages/observability/src/collect.ts</code>

```ts
export declare function collectRunHistory(opts: CollectRunHistoryOptions): RunHistory;
```

#### <code v-pre>fromVitestJson</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L58) <code v-pre>packages/observability/src/collect.ts</code>

```ts
export declare function fromVitestJson(report: VitestStyleReport, opts: FromVitestJsonOptions): TestRunRecord[];
```

### 型

#### <code v-pre>CollectRunHistoryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L3) <code v-pre>packages/observability/src/collect.ts</code>

```ts
export interface CollectRunHistoryOptions {
    /** Existing history to extend */
    history?: RunHistory;
    /** New records to append */
    records: TestRunRecord[];
    /** Cap the number of retained records per testId (FIFO eviction) */
    maxPerTest?: number;
}
```

#### <code v-pre>FromVitestJsonOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L52) <code v-pre>packages/observability/src/collect.ts</code>

```ts
export interface FromVitestJsonOptions {
    runId: string;
}
```

#### <code v-pre>VitestStyleAssertionResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L35) <code v-pre>packages/observability/src/collect.ts</code>

```ts
export interface VitestStyleAssertionResult {
    fullName?: string;
    title?: string;
    status: 'passed' | 'failed' | 'skipped' | 'pending';
    duration?: number;
}
```

#### <code v-pre>VitestStyleReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L47) <code v-pre>packages/observability/src/collect.ts</code>

```ts
export interface VitestStyleReport {
    testResults: VitestStyleTestResult[];
    startTime?: number;
}
```

#### <code v-pre>VitestStyleTestResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L42) <code v-pre>packages/observability/src/collect.ts</code>

```ts
export interface VitestStyleTestResult {
    testFilePath?: string;
    assertionResults: VitestStyleAssertionResult[];
}
```
