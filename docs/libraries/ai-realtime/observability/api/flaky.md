---
title: "@kiwa-lab/observability flaky の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/observability</code> <code v-pre>flaky</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/flaky.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>DEFAULT&#95;FLAKY&#95;MIN&#95;RUNS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/flaky.ts#L9) <code v-pre>packages/observability/src/flaky.ts</code>

flaky と判定する前に要求する最小 run 数。 検出と表示の両方がこの値を見る。 片方だけ変えると「判定した」 と「判定して いない」 の表示が実際の判定とずれる。

```ts
export declare const DEFAULT_FLAKY_MIN_RUNS = 3;
```

#### <code v-pre>detectFlaky</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/flaky.ts#L81) <code v-pre>packages/observability/src/flaky.ts</code>

```ts
export declare function detectFlaky(opts: DetectFlakyOptions): FlakyTest[];
```

#### <code v-pre>flakyEligibility</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/flaky.ts#L69) <code v-pre>packages/observability/src/flaky.ts</code>

flaky を判定できる材料があるかを返す。 **「flaky が無い」 と「flaky を判定していない」 は別**。 `detectFlaky` は `minRuns` に届かない test を黙って飛ばすため、 1 回しか走っていない history では 常に空を返す。 空を「無い」 と読むと、 走らせていない状態と、 走らせて安定して いる状態が同じ表示になる (#1909)。 判定と同じ数え方をここで共有する = 数え方が 2 箇所に分かれると、 表示だけが 実際の判定とずれる。

```ts
export declare function flakyEligibility(opts: {
    history: RunHistory;
    minRuns?: number;
}): FlakyEligibility;
```

### 型

#### <code v-pre>DetectFlakyOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/flaky.ts#L11) <code v-pre>packages/observability/src/flaky.ts</code>

```ts
export interface DetectFlakyOptions {
    history: RunHistory;
    /** Minimum number of runs before a test is eligible for flaky scoring */
    minRuns?: number;
    /** Failure rate threshold; tests with 0 < rate < 1 are flaky; tests above this are reported */
    threshold?: number;
}
```

#### <code v-pre>FlakyEligibility</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/flaky.ts#L49) <code v-pre>packages/observability/src/flaky.ts</code>

```ts
export interface FlakyEligibility {
    /** `minRuns` に届いた testId の数。 0 なら 1 件も判定していない。 */
    eligible: number;
    /** 1 つの testId が持つ最大 run 数。 判定できない理由を示すために出す。 */
    maxRuns: number;
    /** 判定に要求した run 数。 */
    minRuns: number;
}
```
