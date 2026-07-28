---
title: "@kiwa-lab/design-check layout-regression の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/design-check</code> <code v-pre>layout-regression</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/layout-regression.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>assertNoLayoutRegression</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/layout-regression.ts#L120) <code v-pre>packages/design-check/src/layout-regression.ts</code>

assertion helper — layout regression 検知時 throw。

```ts
export declare function assertNoLayoutRegression(baseline: LayoutSnapshot, actual: LayoutSnapshot, opts?: CheckLayoutRegressionOptions): void;
```

#### <code v-pre>checkLayoutRegression</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/layout-regression.ts#L21) <code v-pre>packages/design-check/src/layout-regression.ts</code>

layout regression check — baseline と actual の bounding box 差分を検知する。 pass = true when 全 element が tolerance 内 + missing なし、 false when 差分あり。

```ts
export declare function checkLayoutRegression(baseline: LayoutSnapshot, actual: LayoutSnapshot, opts?: CheckLayoutRegressionOptions): LayoutRegressionResult;
```


