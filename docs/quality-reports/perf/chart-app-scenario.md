# Perf Suite — chart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.05ms | 0.07ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| axis_recompute_batch (5 dataset で computeAxis) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| animation_frame_burst (5 series x 10 frames) | 0.03ms | 0.06ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| drilldown_batch (5 hit + 5 miss) | 0.0077ms | 0.03ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| export_batch (3 SVG + 3 PNG) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.18ms | 200ms | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 0.09ms | 200ms | PASS |
| animation_frame_burst (5 series x 10 frames) | 0.14ms | 200ms | PASS |
| drilldown_batch (5 hit + 5 miss) | 0.04ms | 200ms | PASS |
| export_batch (3 SVG + 3 PNG) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 368 B | 0 B | 102400 B | yes | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 368 B | 0 B | 102400 B | yes | PASS |
| animation_frame_burst (5 series x 10 frames) | 712 B | 0 B | 102400 B | yes | PASS |
| drilldown_batch (5 hit + 5 miss) | 17680 B | 0 B | 102400 B | yes | PASS |
| export_batch (3 SVG + 3 PNG) | 480 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dashboard_render_workflow (10 chart across 4 kinds x 4 providers)

# Perf Report — dashboard_render_workflow (10 chart across 4 kinds x 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.07ms |
| p99 | 0.07ms |
| mean | 0.06ms |
| stdev | 0.0065ms |
| min | 0.05ms |
| max | 0.07ms |
| total | 1.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0025ms | -4.72% |
| p50 | 0.06ms | 0.06ms | -0.00010ms | -0.18% |
| p95 | 0.07ms | 0.08ms | -0.0057ms | -7.38% |
| p99 | 0.07ms | 0.09ms | -0.01ms | -16.52% |
| mean | 0.06ms | 0.06ms | -0.0028ms | -4.61% |
| min | 0.05ms | 0.05ms | -0.00033ms | -0.67% |
| max | 0.07ms | 0.09ms | -0.02ms | -18.45% |
| total | 1.18ms | 1.23ms | -0.06ms | -4.61% |

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
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0017ms | -9.16% |
| p50 | 0.02ms | 0.02ms | -0.0065ms | -27.17% |
| p95 | 0.03ms | 0.03ms | -0.0022ms | -6.85% |
| p99 | 0.03ms | 0.03ms | -0.0037ms | -11.02% |
| mean | 0.02ms | 0.02ms | -0.0050ms | -19.90% |
| min | 0.02ms | 0.02ms | -0.0017ms | -9.01% |
| max | 0.03ms | 0.03ms | -0.0041ms | -11.99% |
| total | 0.40ms | 0.50ms | -0.10ms | -19.90% |

### animation_frame_burst (5 series x 10 frames)

# Perf Report — animation_frame_burst (5 series x 10 frames).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
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
| p10 | 0.03ms | 0.05ms | -0.01ms | -27.99% |
| p50 | 0.04ms | 0.14ms | -0.10ms | -69.54% |
| p95 | 0.06ms | 0.27ms | -0.20ms | -76.73% |
| p99 | 0.07ms | 0.84ms | -0.77ms | -91.97% |
| mean | 0.05ms | 0.17ms | -0.12ms | -72.51% |
| min | 0.03ms | 0.04ms | -0.0086ms | -20.93% |
| max | 0.07ms | 0.98ms | -0.91ms | -93.00% |
| total | 0.94ms | 3.43ms | -2.49ms | -72.51% |

### drilldown_batch (5 hit + 5 miss)

# Perf Report — drilldown_batch (5 hit + 5 miss).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0077ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.0076ms |
| max | 0.06ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0077ms | 0.02ms | -0.01ms | -63.35% |
| p50 | 0.01ms | 0.04ms | -0.03ms | -68.40% |
| p95 | 0.03ms | 0.08ms | -0.05ms | -62.06% |
| p99 | 0.06ms | 0.11ms | -0.05ms | -47.89% |
| mean | 0.02ms | 0.04ms | -0.02ms | -61.14% |
| min | 0.0076ms | 0.02ms | -0.01ms | -63.31% |
| max | 0.06ms | 0.12ms | -0.05ms | -45.46% |
| total | 0.31ms | 0.80ms | -0.49ms | -61.14% |

### export_batch (3 SVG + 3 PNG)

# Perf Report — export_batch (3 SVG + 3 PNG).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0036ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0034ms | -21.18% |
| p50 | 0.01ms | 0.02ms | -0.0037ms | -22.17% |
| p95 | 0.02ms | 0.03ms | -0.0015ms | -5.78% |
| p99 | 0.02ms | 0.03ms | -0.0033ms | -12.12% |
| mean | 0.01ms | 0.02ms | -0.0031ms | -17.23% |
| min | 0.01ms | 0.02ms | -0.0034ms | -21.47% |
| max | 0.02ms | 0.03ms | -0.0038ms | -13.56% |
| total | 0.30ms | 0.36ms | -0.06ms | -17.23% |

