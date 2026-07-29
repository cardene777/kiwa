# Perf Suite — chart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.05ms | 0.07ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| axis_recompute_batch (5 dataset で computeAxis) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| animation_frame_burst (5 series x 10 frames) | 0.03ms | 0.06ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| drilldown_batch (5 hit + 5 miss) | 0.0077ms | 0.02ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| export_batch (3 SVG + 3 PNG) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.19ms | 200ms | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 0.09ms | 200ms | PASS |
| animation_frame_burst (5 series x 10 frames) | 0.14ms | 200ms | PASS |
| drilldown_batch (5 hit + 5 miss) | 0.04ms | 200ms | PASS |
| export_batch (3 SVG + 3 PNG) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | -3776 B | 0 B | 102400 B | yes | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 368 B | 0 B | 102400 B | yes | PASS |
| animation_frame_burst (5 series x 10 frames) | 712 B | 0 B | 102400 B | yes | PASS |
| drilldown_batch (5 hit + 5 miss) | 17728 B | 0 B | 102400 B | yes | PASS |
| export_batch (3 SVG + 3 PNG) | 1280 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dashboard_render_workflow (10 chart across 4 kinds x 4 providers)

# Perf Report — dashboard_render_workflow (10 chart across 4 kinds x 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.07ms |
| p99 | 0.07ms |
| mean | 0.06ms |
| stdev | 0.0082ms |
| min | 0.04ms |
| max | 0.07ms |
| total | 1.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0061ms | -11.37% |
| p50 | 0.05ms | 0.06ms | -0.0026ms | -4.49% |
| p95 | 0.07ms | 0.08ms | -0.0050ms | -6.50% |
| p99 | 0.07ms | 0.09ms | -0.02ms | -16.89% |
| mean | 0.06ms | 0.06ms | -0.0048ms | -7.82% |
| min | 0.04ms | 0.05ms | -0.0048ms | -9.79% |
| max | 0.07ms | 0.09ms | -0.02ms | -19.08% |
| total | 1.14ms | 1.23ms | -0.10ms | -7.82% |

### axis_recompute_batch (5 dataset で computeAxis)

# Perf Report — axis_recompute_batch (5 dataset で computeAxis).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0046ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00058ms | +3.13% |
| p50 | 0.02ms | 0.02ms | -0.0039ms | -16.06% |
| p95 | 0.03ms | 0.03ms | -0.00024ms | -0.75% |
| p99 | 0.03ms | 0.03ms | -0.00071ms | -2.11% |
| mean | 0.02ms | 0.02ms | -0.0021ms | -8.38% |
| min | 0.02ms | 0.02ms | +0.00029ms | +1.58% |
| max | 0.03ms | 0.03ms | -0.00083ms | -2.42% |
| total | 0.46ms | 0.50ms | -0.04ms | -8.38% |

### animation_frame_burst (5 series x 10 frames)

# Perf Report — animation_frame_burst (5 series x 10 frames).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.05ms |
| p95 | 0.06ms |
| p99 | 0.07ms |
| mean | 0.05ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.07ms |
| total | 0.94ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.05ms | -0.01ms | -28.24% |
| p50 | 0.05ms | 0.14ms | -0.09ms | -63.38% |
| p95 | 0.06ms | 0.27ms | -0.20ms | -76.23% |
| p99 | 0.07ms | 0.84ms | -0.77ms | -92.13% |
| mean | 0.05ms | 0.17ms | -0.12ms | -72.46% |
| min | 0.03ms | 0.04ms | -0.0084ms | -20.43% |
| max | 0.07ms | 0.98ms | -0.91ms | -93.21% |
| total | 0.94ms | 3.43ms | -2.49ms | -72.46% |

### drilldown_batch (5 hit + 5 miss)

# Perf Report — drilldown_batch (5 hit + 5 miss).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0077ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0045ms |
| min | 0.0075ms |
| max | 0.02ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0077ms | 0.02ms | -0.01ms | -63.70% |
| p50 | 0.01ms | 0.04ms | -0.02ms | -61.31% |
| p95 | 0.02ms | 0.08ms | -0.06ms | -73.38% |
| p99 | 0.02ms | 0.11ms | -0.09ms | -79.41% |
| mean | 0.01ms | 0.04ms | -0.03ms | -65.44% |
| min | 0.0075ms | 0.02ms | -0.01ms | -63.71% |
| max | 0.02ms | 0.12ms | -0.09ms | -80.45% |
| total | 0.28ms | 0.80ms | -0.52ms | -65.44% |

### export_batch (3 SVG + 3 PNG)

# Perf Report — export_batch (3 SVG + 3 PNG).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0033ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0031ms | -19.06% |
| p50 | 0.01ms | 0.02ms | -0.0032ms | -19.05% |
| p95 | 0.02ms | 0.03ms | -0.0045ms | -18.02% |
| p99 | 0.03ms | 0.03ms | -0.0018ms | -6.65% |
| mean | 0.01ms | 0.02ms | -0.0032ms | -17.71% |
| min | 0.01ms | 0.02ms | -0.0029ms | -18.33% |
| max | 0.03ms | 0.03ms | -0.0011ms | -4.07% |
| total | 0.30ms | 0.36ms | -0.06ms | -17.71% |

