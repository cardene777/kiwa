---
title: "@kiwa-lab/chart axis の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/chart</code> <code v-pre>axis</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/axis.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>computeAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/axis.ts#L18) <code v-pre>packages/chart/src/axis.ts</code>

numeric data から axis の domain + tick + scale を計算。 real chart library の d3-scale 相当を mock、 nice=true で見栄えの良い round 値に丸める。

```ts
export declare function computeAxis(values: number[], options?: AxisOptions): AxisResult;
```

### 型

#### <code v-pre>AxisOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/axis.ts#L1) <code v-pre>packages/chart/src/axis.ts</code>

```ts
export interface AxisOptions {
    tickCount?: number;
    nice?: boolean;
    scale?: 'linear' | 'log';
}
```

#### <code v-pre>AxisResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/axis.ts#L7) <code v-pre>packages/chart/src/axis.ts</code>

```ts
export interface AxisResult {
    domain: [number, number];
    ticks: number[];
    scale: 'linear' | 'log';
    tickFormat: (value: number) => string;
}
```
