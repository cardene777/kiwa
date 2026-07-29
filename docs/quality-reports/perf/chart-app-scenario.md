# Perf Suite — chart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.05ms | 0.07ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| axis_recompute_batch (5 dataset で computeAxis) | 0.02ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| animation_frame_burst (5 series x 10 frames) | 0.03ms | 0.05ms | 100ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |
| drilldown_batch (5 hit + 5 miss) | 0.0077ms | 0.02ms | 100ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |
| export_batch (3 SVG + 3 PNG) | 0.01ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.17ms | 200ms | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 0.08ms | 200ms | PASS |
| animation_frame_burst (5 series x 10 frames) | 0.15ms | 200ms | PASS |
| drilldown_batch (5 hit + 5 miss) | 0.04ms | 200ms | PASS |
| export_batch (3 SVG + 3 PNG) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 224 B | 0 B | 102400 B | yes | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 464 B | 0 B | 102400 B | yes | PASS |
| animation_frame_burst (5 series x 10 frames) | 616 B | 0 B | 102400 B | yes | PASS |
| drilldown_batch (5 hit + 5 miss) | 17760 B | 0 B | 102400 B | yes | PASS |
| export_batch (3 SVG + 3 PNG) | 224 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.08ms |
| mean | 0.05ms |
| stdev | 0.0087ms |
| min | 0.04ms |
| max | 0.08ms |
| total | 1.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0088ms | -16.27% |
| p50 | 0.05ms | 0.06ms | -0.0024ms | -4.23% |
| p95 | 0.07ms | 0.08ms | -0.0068ms | -8.75% |
| p99 | 0.08ms | 0.09ms | -0.01ms | -13.08% |
| mean | 0.05ms | 0.06ms | -0.0069ms | -11.13% |
| min | 0.04ms | 0.05ms | -0.0076ms | -15.44% |
| max | 0.08ms | 0.09ms | -0.01ms | -13.99% |
| total | 1.10ms | 1.23ms | -0.14ms | -11.13% |

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
| stdev | 0.0038ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0018ms | -9.56% |
| p50 | 0.02ms | 0.02ms | -0.0067ms | -27.95% |
| p95 | 0.03ms | 0.03ms | -0.0047ms | -14.81% |
| p99 | 0.03ms | 0.03ms | -0.0063ms | -18.51% |
| mean | 0.02ms | 0.02ms | -0.0056ms | -22.35% |
| min | 0.02ms | 0.02ms | -0.0017ms | -9.01% |
| max | 0.03ms | 0.03ms | -0.0067ms | -19.37% |
| total | 0.39ms | 0.50ms | -0.11ms | -22.35% |

### animation_frame_burst (5 series x 10 frames)

# Perf Report — animation_frame_burst (5 series x 10 frames).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.04ms |
| stdev | 0.0072ms |
| min | 0.03ms |
| max | 0.06ms |
| total | 0.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.05ms | -0.01ms | -29.24% |
| p50 | 0.04ms | 0.14ms | -0.10ms | -70.88% |
| p95 | 0.05ms | 0.27ms | -0.21ms | -79.99% |
| p99 | 0.06ms | 0.84ms | -0.78ms | -93.20% |
| mean | 0.04ms | 0.17ms | -0.13ms | -76.41% |
| min | 0.03ms | 0.04ms | -0.0091ms | -22.04% |
| max | 0.06ms | 0.98ms | -0.92ms | -94.10% |
| total | 0.81ms | 3.43ms | -2.62ms | -76.41% |

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
| stdev | 0.0051ms |
| min | 0.0076ms |
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0077ms | 0.02ms | -0.01ms | -63.51% |
| p50 | 0.01ms | 0.04ms | -0.03ms | -67.28% |
| p95 | 0.02ms | 0.08ms | -0.06ms | -75.83% |
| p99 | 0.02ms | 0.11ms | -0.09ms | -79.25% |
| mean | 0.01ms | 0.04ms | -0.03ms | -68.17% |
| min | 0.0076ms | 0.02ms | -0.01ms | -63.31% |
| max | 0.02ms | 0.12ms | -0.09ms | -79.83% |
| total | 0.25ms | 0.80ms | -0.54ms | -68.17% |

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
| mean | 0.02ms |
| stdev | 0.0040ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0029ms | -17.79% |
| p50 | 0.01ms | 0.02ms | -0.0019ms | -11.21% |
| p95 | 0.02ms | 0.03ms | -0.00088ms | -3.51% |
| p99 | 0.02ms | 0.03ms | -0.0029ms | -10.59% |
| mean | 0.02ms | 0.02ms | -0.0013ms | -7.37% |
| min | 0.01ms | 0.02ms | -0.0027ms | -17.01% |
| max | 0.02ms | 0.03ms | -0.0034ms | -12.20% |
| total | 0.33ms | 0.36ms | -0.03ms | -7.37% |

