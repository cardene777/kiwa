---
title: "@kiwa-lab/observability collect の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/observability</code> <code v-pre>collect</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>collectRunHistory</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L12) <code v-pre>packages/observability/src/collect.ts</code>

```ts
export declare function collectRunHistory(opts: CollectRunHistoryOptions): RunHistory;
```

#### <code v-pre>fromPlaywrightJson</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L178) <code v-pre>packages/observability/src/collect.ts</code>

Playwright の JSON レポートを `TestRunRecord[]` へ写す。 `fromVitestJson` と対になる入口で、返す形も同じ。 違いは入力の木構造だけ。 **`results` が空の test も 1 件として数える**。 Playwright は未実行の test にも `status: 'skipped'` を付けるため、落とすと「実行していない」 が 「存在しない」 に化けて突き合わせが実物とずれる。

```ts
export declare function fromPlaywrightJson(report: PlaywrightJsonReport, opts: FromPlaywrightJsonOptions): TestRunRecord[];
```

#### <code v-pre>fromVitestJson</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L59) <code v-pre>packages/observability/src/collect.ts</code>

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

#### <code v-pre>FromPlaywrightJsonOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L121) <code v-pre>packages/observability/src/collect.ts</code>

```ts
export interface FromPlaywrightJsonOptions {
    runId: string;
}
```

#### <code v-pre>FromVitestJsonOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L53) <code v-pre>packages/observability/src/collect.ts</code>

```ts
export interface FromVitestJsonOptions {
    runId: string;
}
```

#### <code v-pre>PlaywrightJsonReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L116) <code v-pre>packages/observability/src/collect.ts</code>

```ts
export interface PlaywrightJsonReport {
    suites: PlaywrightJsonSuite[];
    stats: {
        startTime: string;
    };
}
```

#### <code v-pre>PlaywrightJsonResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L93) <code v-pre>packages/observability/src/collect.ts</code>

Playwright `JSONReport` の最小形。 実 `JSONReport` は `config` 等も持つが、突き合わせに要るのは suite の木と各 test の状態だけなので、読む field に絞って宣言する。 絞ることで、Playwright 側が無関係な field を増やしても壊れない。

```ts
export interface PlaywrightJsonResult {
    status?: 'passed' | 'failed' | 'timedOut' | 'interrupted' | 'skipped' | undefined;
    duration: number;
}
```

#### <code v-pre>PlaywrightJsonSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L104) <code v-pre>packages/observability/src/collect.ts</code>

```ts
export interface PlaywrightJsonSpec {
    title: string;
    tests: PlaywrightJsonTest[];
}
```

#### <code v-pre>PlaywrightJsonSuite</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L109) <code v-pre>packages/observability/src/collect.ts</code>

```ts
export interface PlaywrightJsonSuite {
    title: string;
    specs: PlaywrightJsonSpec[];
    /** `test.describe` の入れ子。 深さに上限は無い。 */
    suites?: PlaywrightJsonSuite[];
}
```

#### <code v-pre>PlaywrightJsonTest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L98) <code v-pre>packages/observability/src/collect.ts</code>

```ts
export interface PlaywrightJsonTest {
    /** test 単位の判定。 実 JSON では必須だが、欠落時も末尾 result から復元する。 */
    status?: 'skipped' | 'expected' | 'unexpected' | 'flaky';
    results: PlaywrightJsonResult[];
}
```

#### <code v-pre>VitestStyleAssertionResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L36) <code v-pre>packages/observability/src/collect.ts</code>

```ts
export interface VitestStyleAssertionResult {
    fullName?: string;
    title?: string;
    status: 'passed' | 'failed' | 'skipped' | 'pending';
    duration?: number;
}
```

#### <code v-pre>VitestStyleReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L48) <code v-pre>packages/observability/src/collect.ts</code>

```ts
export interface VitestStyleReport {
    testResults: VitestStyleTestResult[];
    startTime?: number;
}
```

#### <code v-pre>VitestStyleTestResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L43) <code v-pre>packages/observability/src/collect.ts</code>

```ts
export interface VitestStyleTestResult {
    testFilePath?: string;
    assertionResults: VitestStyleAssertionResult[];
}
```
