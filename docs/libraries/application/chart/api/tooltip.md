---
title: "@kiwa-lab/chart tooltip の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/chart</code> <code v-pre>tooltip</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/tooltip.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>dispatchTooltip</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/tooltip.ts#L19) <code v-pre>packages/chart/src/tooltip.ts</code>

event 座標に最も近い data node (rect / circle / path) を探して tooltip 内容を決定。 real chart library の hover handler + tooltip content builder 相当。

```ts
export declare function dispatchTooltip(rendered: ChartNode, event: TooltipEvent): TooltipContent;
```

### 型

#### <code v-pre>TooltipContent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/tooltip.ts#L8) <code v-pre>packages/chart/src/tooltip.ts</code>

```ts
export interface TooltipContent {
    visible: boolean;
    series?: string;
    value?: number;
    targetType?: string;
}
```

#### <code v-pre>TooltipEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/tooltip.ts#L3) <code v-pre>packages/chart/src/tooltip.ts</code>

```ts
export interface TooltipEvent {
    x: number;
    y: number;
}
```
