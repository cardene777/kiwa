# @kiwa-lab/chart

Chart mock harness for kiwa — Recharts / Chart.js / D3 / Visx を統一 interface で invoke する in-process mock。

## API

- `createChartClient(options)` = provider mock client (renderChart / captureLegend / dispatchTooltip / clear)
- `renderChart(spec)` = provider 別 chart render (bar / line / pie / scatter)、 data → svg-like tree に変換
- `computeAxis(data, options)` = numeric axis の tick + domain + scale 計算
- `captureLegend(rendered)` = legend entry 一覧 (name / color / dataKey / hidden)
- `dispatchTooltip(rendered, event)` = hover event → tooltip 内容決定
