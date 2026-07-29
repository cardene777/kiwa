# Perf Suite — chart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.05ms | 0.08ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| axis_recompute_batch (5 dataset で computeAxis) | 0.02ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| animation_frame_burst (5 series x 10 frames) | 0.03ms | 0.06ms | 100ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| drilldown_batch (5 hit + 5 miss) | 0.02ms | 0.03ms | 100ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| export_batch (3 SVG + 3 PNG) | 0.01ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.19ms | 200ms | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 0.08ms | 200ms | PASS |
| animation_frame_burst (5 series x 10 frames) | 0.14ms | 200ms | PASS |
| drilldown_batch (5 hit + 5 miss) | 0.04ms | 200ms | PASS |
| export_batch (3 SVG + 3 PNG) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 5336 B | 0 B | 102400 B | yes | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 368 B | 0 B | 102400 B | yes | PASS |
| animation_frame_burst (5 series x 10 frames) | 616 B | 0 B | 102400 B | yes | PASS |
| drilldown_batch (5 hit + 5 miss) | 10744 B | 0 B | 102400 B | yes | PASS |
| export_batch (3 SVG + 3 PNG) | 176 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dashboard_render_workflow (10 chart across 4 kinds x 4 providers)

# Perf Report — dashboard_render_workflow (10 chart across 4 kinds x 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.08ms |
| p99 | 0.09ms |
| mean | 0.06ms |
| stdev | 0.01ms |
| min | 0.04ms |
| max | 0.09ms |
| total | 1.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0042ms | -7.80% |
| p50 | 0.06ms | 0.06ms | +0.0034ms | +5.87% |
| p95 | 0.08ms | 0.08ms | +0.0068ms | +8.73% |
| p99 | 0.09ms | 0.09ms | +0.0013ms | +1.41% |
| mean | 0.06ms | 0.06ms | +0.0010ms | +1.65% |
| min | 0.04ms | 0.05ms | -0.0066ms | -13.42% |
| max | 0.09ms | 0.09ms | -0.00013ms | -0.14% |
| total | 1.25ms | 1.23ms | +0.02ms | +1.65% |

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
| stdev | 0.0039ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00089ms | -4.78% |
| p50 | 0.02ms | 0.02ms | -0.0033ms | -13.63% |
| p95 | 0.03ms | 0.03ms | -0.0038ms | -11.76% |
| p99 | 0.03ms | 0.03ms | -0.0032ms | -9.49% |
| mean | 0.02ms | 0.02ms | -0.0029ms | -11.69% |
| min | 0.02ms | 0.02ms | -0.0012ms | -6.31% |
| max | 0.03ms | 0.03ms | -0.0031ms | -8.96% |
| total | 0.44ms | 0.50ms | -0.06ms | -11.69% |

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
| total | 0.92ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.05ms | -0.01ms | -26.79% |
| p50 | 0.04ms | 0.14ms | -0.09ms | -68.29% |
| p95 | 0.06ms | 0.27ms | -0.20ms | -76.86% |
| p99 | 0.07ms | 0.84ms | -0.77ms | -92.00% |
| mean | 0.05ms | 0.17ms | -0.13ms | -73.10% |
| min | 0.03ms | 0.04ms | -0.0083ms | -20.02% |
| max | 0.07ms | 0.98ms | -0.91ms | -93.03% |
| total | 0.92ms | 3.43ms | -2.51ms | -73.10% |

### drilldown_batch (5 hit + 5 miss)

# Perf Report — drilldown_batch (5 hit + 5 miss).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0039ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0059ms | -27.80% |
| p50 | 0.02ms | 0.04ms | -0.02ms | -60.02% |
| p95 | 0.03ms | 0.08ms | -0.05ms | -67.79% |
| p99 | 0.03ms | 0.11ms | -0.08ms | -73.82% |
| mean | 0.02ms | 0.04ms | -0.02ms | -57.03% |
| min | 0.02ms | 0.02ms | -0.0055ms | -26.41% |
| max | 0.03ms | 0.12ms | -0.09ms | -74.85% |
| total | 0.34ms | 0.80ms | -0.45ms | -57.03% |

### export_batch (3 SVG + 3 PNG)

# Perf Report — export_batch (3 SVG + 3 PNG).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0078ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0030ms | -18.82% |
| p50 | 0.01ms | 0.02ms | -0.0031ms | -18.43% |
| p95 | 0.03ms | 0.03ms | +0.0018ms | +7.28% |
| p99 | 0.04ms | 0.03ms | +0.02ms | +55.60% |
| mean | 0.02ms | 0.02ms | -0.0011ms | -6.18% |
| min | 0.01ms | 0.02ms | -0.0029ms | -18.33% |
| max | 0.05ms | 0.03ms | +0.02ms | +66.57% |
| total | 0.34ms | 0.36ms | -0.02ms | -6.18% |

