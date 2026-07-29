# Perf Suite — ruby-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.0059ms | 0.01ms | 100ms | 0.00044ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_framework_batch (4 framework dispatch x2) | 0.0043ms | 0.0051ms | 100ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |
| erb_render_missing_key (5 render + missing collect) | 0.0020ms | 0.0024ms | 100ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | cpu | 0.08ms | 0.0059ms | 0.074 | 0.076 | 0.0061ms | 0.0063ms |
| multi_framework_batch (4 framework dispatch x2) | cpu | 0.08ms | 0.0043ms | 0.053 | 0.053 | 0.0044ms | 0.0044ms |
| erb_render_missing_key (5 render + missing collect) | cpu | 0.08ms | 0.0020ms | 0.025 | 0.025 | 0.0021ms | 0.0020ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.04ms | 200ms | PASS |
| multi_framework_batch (4 framework dispatch x2) | 0.04ms | 200ms | PASS |
| erb_render_missing_key (5 render + missing collect) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 6616 B | 0 B | 102400 B | yes | PASS |
| multi_framework_batch (4 framework dispatch x2) | 6176 B | 0 B | 102400 B | yes | PASS |
| erb_render_missing_key (5 render + missing collect) | -1928 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rails_crud_workflow (10 dispatch with AR log)

# Perf Report — rails_crud_workflow (10 dispatch with AR log).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0059ms |
| p50 | 0.0060ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0072ms |
| stdev | 0.0019ms |
| min | 0.0057ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0063ms | -0.00042ms | -6.70% |
| p50 | 0.0060ms | 0.0070ms | -0.0010ms | -14.21% |
| p95 | 0.01ms | 0.01ms | -0.0031ms | -22.02% |
| p99 | 0.01ms | 0.02ms | -0.0073ms | -39.67% |
| mean | 0.0072ms | 0.0083ms | -0.0012ms | -13.85% |
| min | 0.0057ms | 0.0060ms | -0.00033ms | -5.51% |
| max | 0.01ms | 0.02ms | -0.0083ms | -42.89% |
| total | 0.14ms | 0.17ms | -0.02ms | -13.85% |

### multi_framework_batch (4 framework dispatch x2)

# Perf Report — multi_framework_batch (4 framework dispatch x2).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0043ms |
| p50 | 0.0043ms |
| p95 | 0.0051ms |
| p99 | 0.0055ms |
| mean | 0.0045ms |
| stdev | 0.00034ms |
| min | 0.0042ms |
| max | 0.0056ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0043ms | 0.0044ms | -0.00013ms | -2.86% |
| p50 | 0.0043ms | 0.0045ms | -0.00019ms | -4.17% |
| p95 | 0.0051ms | 0.0053ms | -0.00024ms | -4.46% |
| p99 | 0.0055ms | 0.0056ms | -0.000081ms | -1.46% |
| mean | 0.0045ms | 0.0047ms | -0.00023ms | -4.84% |
| min | 0.0042ms | 0.0044ms | -0.00017ms | -3.79% |
| max | 0.0056ms | 0.0056ms | -0.000042ms | -0.75% |
| total | 0.09ms | 0.09ms | -0.0045ms | -4.84% |

### erb_render_missing_key (5 render + missing collect)

# Perf Report — erb_render_missing_key (5 render + missing collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0020ms |
| p50 | 0.0020ms |
| p95 | 0.0024ms |
| p99 | 0.0025ms |
| mean | 0.0021ms |
| stdev | 0.00013ms |
| min | 0.0020ms |
| max | 0.0025ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0020ms | -0.000041ms | -2.01% |
| p50 | 0.0020ms | 0.0021ms | -0.000041ms | -1.97% |
| p95 | 0.0024ms | 0.0032ms | -0.00079ms | -24.70% |
| p99 | 0.0025ms | 0.01ms | -0.0097ms | -79.82% |
| mean | 0.0021ms | 0.0028ms | -0.00067ms | -24.34% |
| min | 0.0020ms | 0.0020ms | -0.000041ms | -2.01% |
| max | 0.0025ms | 0.01ms | -0.01ms | -82.90% |
| total | 0.04ms | 0.06ms | -0.01ms | -24.34% |

