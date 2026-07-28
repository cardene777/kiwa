---
title: "@kiwa-lab/chart animation の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/chart</code> <code v-pre>animation</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/animation.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>animateChartFrames</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/animation.ts#L20) <code v-pre>packages/chart/src/animation.ts</code>

animation frame 列を生成、 fromValues → toValues を frames 数で補間。 real Recharts / Chart.js の animation stream を mock。

```ts
export declare function animateChartFrames(build: (values: number[]) => ChartNode, opts: AnimateChartOptions): AnimationFrame[];
```

#### <code v-pre>computeResponsiveDimensions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/animation.ts#L50) <code v-pre>packages/chart/src/animation.ts</code>

viewport width から chart dimensions + breakpoint を導出。 responsive chart の mock、 container width に応じて aspect ratio 調整。

```ts
export declare function computeResponsiveDimensions(containerWidth: number, aspectRatio?: number): ResponsiveDimensions;
```

### 型

#### <code v-pre>AnimateChartOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/animation.ts#L9) <code v-pre>packages/chart/src/animation.ts</code>

```ts
export interface AnimateChartOptions {
    fromValues: number[];
    toValues: number[];
    frames?: number;
    easing?: 'linear' | 'ease-in-out';
}
```

#### <code v-pre>AnimationFrame</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/animation.ts#L3) <code v-pre>packages/chart/src/animation.ts</code>

```ts
export interface AnimationFrame {
    time: number;
    tree: ChartNode;
    interpolated: boolean;
}
```

#### <code v-pre>ResponsiveDimensions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/animation.ts#L40) <code v-pre>packages/chart/src/animation.ts</code>

```ts
export interface ResponsiveDimensions {
    width: number;
    height: number;
    breakpoint: 'mobile' | 'tablet' | 'desktop';
}
```
