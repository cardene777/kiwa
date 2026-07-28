# @kiwa-lab/chart リファレンス

## spec と描画 tree

`ChartSpec` は `kind` と `series` を必須とし、任意で `width`、`height`、`title` を受け取ります。kind は `bar`、`line`、`pie`、`scatter` です。width と height の既定値は四百と三百です。

`renderChart(spec)` は root `svg` node を返します。node は type、attrs、children、任意の meta を持ちます。hidden series は除外され、root meta の `seriesCount` は表示する series 数です。

## client

`createChartClient(options)` は provider、時刻、id seed を受け取ります。provider の既定値は `recharts` です。client の `renderChart` は `RenderedChart` を記録し、`listRendered` はコピー、`clear` は履歴を消去します。

`captureLegend` と `dispatchTooltip` は `RenderedChart` を受け取る client method と、tree を直接受け取る top-level API の両方があります。

## axis と interaction

`computeAxis(values, options)` は domain、ticks、scale、`tickFormat` を返します。values が空なら domain と ticks は `[0, 1]` です。nice domain はデータの範囲を tick count に基づいて丸めます。

`dispatchTooltip` は最寄りの座標を持つ node を返し、該当しなければ `{ visible: false }` を返します。`drillDown` は series 名とゼロ始まり index から node を探し、見つからなければ `found: false` と value null を返します。

## 拡張 API

`animateChartFrames` は値を補間した tree の frame 列を作ります。`computeResponsiveDimensions` は mobile、tablet、desktop の breakpoint を返します。`exportChart` は SVG string または PNG mock data URL を返します。

`withObservability` は render 処理を観測 hook で包み、`RenderMetric` を扱う helper です。

<!-- kiwa-public-api:start -->

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [animation.ts](./api/animation) | 2 | 3 |
| [axis.ts](./api/axis) | 1 | 2 |
| [client.ts](./api/client) | 1 | 3 |
| [drilldown.ts](./api/drilldown) | 2 | 3 |
| [legend.ts](./api/legend) | 1 | 1 |
| [observability.ts](./api/observability) | 1 | 2 |
| [render.ts](./api/render) | 1 | 5 |
| [tooltip.ts](./api/tooltip) | 1 | 2 |

<!-- kiwa-public-api:end -->
