---
title: "@kiwa-lab/chart drilldown の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/chart</code> <code v-pre>drilldown</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/drilldown.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>drillDown</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/drilldown.ts#L20) <code v-pre>packages/chart/src/drilldown.ts</code>

chart tree を掘り下げて特定 series + data index の detail node を取得。 real chart lib の onClick → drill-down navigation を mock。

```ts
export declare function drillDown(tree: ChartNode, request: DrillDownRequest): DrillDownResult;
```

#### <code v-pre>exportChart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/drilldown.ts#L44) <code v-pre>packages/chart/src/drilldown.ts</code>

chart tree を SVG string or PNG mock bytes に変換。 real Chart.js の canvas.toDataURL / Recharts の SVG export を mock。

```ts
export declare function exportChart(tree: ChartNode, options?: ExportOptions): {
    format: 'svg' | 'png';
    content: string;
    bytes: number;
};
```

### 型

#### <code v-pre>DrillDownRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/drilldown.ts#L3) <code v-pre>packages/chart/src/drilldown.ts</code>

```ts
export interface DrillDownRequest {
    seriesName: string;
    dataIndex: number;
}
```

#### <code v-pre>DrillDownResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/drilldown.ts#L8) <code v-pre>packages/chart/src/drilldown.ts</code>

```ts
export interface DrillDownResult {
    seriesName: string;
    dataIndex: number;
    value: number | null;
    detailNodes: ChartNode[];
    found: boolean;
}
```

#### <code v-pre>ExportOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/drilldown.ts#L35) <code v-pre>packages/chart/src/drilldown.ts</code>

```ts
export interface ExportOptions {
    format?: 'svg' | 'png';
    scale?: number;
}
```
