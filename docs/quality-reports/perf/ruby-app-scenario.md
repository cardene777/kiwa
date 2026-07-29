# Perf Suite — ruby-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.0054ms | 0.01ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| multi_framework_batch (4 framework dispatch x2) | 0.0037ms | 0.0064ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| erb_render_missing_key (5 render + missing collect) | 0.0025ms | 0.0047ms | 100ms | 0.00050ms | PASS | stable (p10 +5% (閾値未満)、 p95 +46% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.03ms | 200ms | PASS |
| multi_framework_batch (4 framework dispatch x2) | 0.03ms | 200ms | PASS |
| erb_render_missing_key (5 render + missing collect) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 11064 B | 0 B | 102400 B | yes | PASS |
| multi_framework_batch (4 framework dispatch x2) | 1192 B | 0 B | 102400 B | yes | PASS |
| erb_render_missing_key (5 render + missing collect) | -2984 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rails_crud_workflow (10 dispatch with AR log)

# Perf Report — rails_crud_workflow (10 dispatch with AR log).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0054ms |
| p50 | 0.0056ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0070ms |
| stdev | 0.0027ms |
| min | 0.0053ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0054ms | 0.0075ms | -0.0021ms | -27.49% |
| p50 | 0.0056ms | 0.0077ms | -0.0021ms | -27.29% |
| p95 | 0.01ms | 0.01ms | +0.00066ms | +5.98% |
| p99 | 0.01ms | 0.01ms | +0.0031ms | +26.36% |
| mean | 0.0070ms | 0.0085ms | -0.0014ms | -16.82% |
| min | 0.0053ms | 0.0074ms | -0.0021ms | -28.07% |
| max | 0.02ms | 0.01ms | +0.0037ms | +31.11% |
| total | 0.14ms | 0.17ms | -0.03ms | -16.82% |

### multi_framework_batch (4 framework dispatch x2)

# Perf Report — multi_framework_batch (4 framework dispatch x2).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0037ms |
| p50 | 0.0050ms |
| p95 | 0.0064ms |
| p99 | 0.0097ms |
| mean | 0.0051ms |
| stdev | 0.0015ms |
| min | 0.0037ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0049ms | -0.0012ms | -24.55% |
| p50 | 0.0050ms | 0.0050ms | -0.000063ms | -1.24% |
| p95 | 0.0064ms | 0.0058ms | +0.00055ms | +9.51% |
| p99 | 0.0097ms | 0.0058ms | +0.0039ms | +67.06% |
| mean | 0.0051ms | 0.0051ms | -0.000035ms | -0.68% |
| min | 0.0037ms | 0.0049ms | -0.0012ms | -23.94% |
| max | 0.01ms | 0.0058ms | +0.0048ms | +81.45% |
| total | 0.10ms | 0.10ms | -0.00070ms | -0.68% |

### erb_render_missing_key (5 render + missing collect)

# Perf Report — erb_render_missing_key (5 render + missing collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0025ms |
| p50 | 0.0027ms |
| p95 | 0.0047ms |
| p99 | 0.0059ms |
| mean | 0.0031ms |
| stdev | 0.00093ms |
| min | 0.0023ms |
| max | 0.0063ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0024ms | +0.00011ms | +4.56% |
| p50 | 0.0027ms | 0.0024ms | +0.00033ms | +13.78% |
| p95 | 0.0047ms | 0.0032ms | +0.0015ms | +46.19% |
| p99 | 0.0059ms | 0.0036ms | +0.0024ms | +66.14% |
| mean | 0.0031ms | 0.0026ms | +0.00050ms | +19.56% |
| min | 0.0023ms | 0.0024ms | -0.000084ms | -3.54% |
| max | 0.0063ms | 0.0037ms | +0.0026ms | +70.49% |
| total | 0.06ms | 0.05ms | +0.010ms | +19.56% |

