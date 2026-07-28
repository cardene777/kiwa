---
title: "@kiwa-lab/chart legend の API 契約"
---

# <code v-pre>@kiwa-lab/chart</code> <code v-pre>legend</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/legend.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>captureLegend</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/legend.ts#L14) <code v-pre>packages/chart/src/legend.ts</code>

rendered chart tree を走査して series 名 + 色 + 表示状態を legend entry 化。 real chart library の Legend component が render する data table 相当。

```ts
export declare function captureLegend(rendered: ChartNode): LegendEntry[];
```

### 型

#### <code v-pre>LegendEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/legend.ts#L3) <code v-pre>packages/chart/src/legend.ts</code>

```ts
export interface LegendEntry {
    name: string;
    color: string;
    dataKey?: string;
    hidden: boolean;
}
```
