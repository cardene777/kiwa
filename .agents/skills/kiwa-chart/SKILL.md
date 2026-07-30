---
name: kiwa-chart
description: |
  @kiwa-lab/chart (Recharts / Chart.js / D3 / Visx 統一 mock harness) を使った chart data + render test 生成 skill。
  `createChartClient` で provider mock を立て、 `renderChart` で bar / line / pie / scatter を data → svg-like tree に変換、 `computeAxis` で tick + domain + scale 計算、 `captureLegend` / `dispatchTooltip` で interaction 経路を verify できる。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-chart — chart data + render test 生成

`@kiwa-lab/chart` の 4 lib (Recharts / Chart.js / D3 / Visx) 統一 mock を使った chart test を Vitest 形式で生成する。

## 目的

chart component を「lib を差し替えても同じ data → visual 表現を担保する」 test で書く。 lib 別 render API (Recharts JSX / Chart.js config / D3 selection / Visx primitive) を吸収した抽象で test 化する。

## 前提

- `pnpm add -D @kiwa-lab/chart` install 済
- Vitest 環境
- 対象 module に chart component が存在

## オプション

- `--module {name}` — test 対象 chart module
- `--type {bar|line|pie|scatter}` — chart type
- `--provider {recharts|chartjs|d3|visx}` — 主要 provider
- `--output {path}` — 生成 test path

## 実行フロー

### Step 1: renderChart workflow test 生成

`createChartClient({ provider })` で client、 `renderChart({ kind: 'bar', series })` で svg-like tree を取得し、series 数、bar 数、color 割当を assertion します。4 provider を `it.each` で確認します。

### Step 2: computeAxis test 生成

`computeAxis(values, { tickCount, nice, scale })` で tick、domain、scale を計算し、負の値、log scale、空の値の三つの経路を確認します。

### Step 3: legend + tooltip interaction test 生成

`captureLegend(rendered)` で legend entry 一覧 assert、 `dispatchTooltip(rendered, { x, y })` で hover event → tooltip 内容決定の verify。

## 使用例

```bash
/kiwa-chart --module revenue --type line --output tests/integration/revenue.chart.test.ts
/kiwa-chart --module distribution --type pie --provider recharts
```
