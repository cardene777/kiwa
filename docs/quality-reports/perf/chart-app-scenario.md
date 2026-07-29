# Perf Suite — chart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.08ms | 100ms | PASS | stable (差 0.15ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| axis_recompute_batch (5 dataset で computeAxis) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1503%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| animation_frame_burst (5 series x 10 frames) | 1.37ms | 100ms | PASS | regressed — gate 無効 (regressionGate=false) |
| drilldown_batch (5 hit + 5 miss) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1074%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| export_batch (3 SVG + 3 PNG) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1956%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.19ms | 200ms | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 0.08ms | 200ms | PASS |
| animation_frame_burst (5 series x 10 frames) | 0.26ms | 200ms | PASS |
| drilldown_batch (5 hit + 5 miss) | 0.04ms | 200ms | PASS |
| export_batch (3 SVG + 3 PNG) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 776 B | 0 B | 102400 B | yes | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 11488 B | 0 B | 102400 B | yes | PASS |
| animation_frame_burst (5 series x 10 frames) | 240 B | 0 B | 102400 B | yes | PASS |
| drilldown_batch (5 hit + 5 miss) | 25312 B | 0 B | 102400 B | yes | PASS |
| export_batch (3 SVG + 3 PNG) | 944 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dashboard_render_workflow (10 chart across 4 kinds x 4 providers)

# Perf Report — dashboard_render_workflow (10 chart across 4 kinds x 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.06ms |
| p95 | 0.08ms |
| p99 | 0.08ms |
| mean | 0.07ms |
| stdev | 0.01ms |
| min | 0.05ms |
| max | 0.09ms |
| total | 1.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.06ms | 0.07ms | -0.01ms | -13.32% |
| p95 | 0.08ms | 0.22ms | -0.15ms | -65.35% |
| p99 | 0.08ms | 0.23ms | -0.15ms | -64.04% |
| mean | 0.07ms | 0.10ms | -0.04ms | -35.51% |
| min | 0.05ms | 0.06ms | -0.00ms | -8.38% |
| max | 0.09ms | 0.24ms | -0.15ms | -63.73% |
| total | 1.33ms | 2.06ms | -0.73ms | -35.51% |

### axis_recompute_batch (5 dataset で computeAxis)

# Perf Report — axis_recompute_batch (5 dataset で computeAxis).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +14.87% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -0.72% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +1.63% |
| mean | 0.02ms | 0.02ms | +0.00ms | +0.98% |
| min | 0.02ms | 0.02ms | -0.00ms | -3.23% |
| max | 0.03ms | 0.03ms | +0.00ms | +2.20% |
| total | 0.48ms | 0.47ms | +0.00ms | +0.98% |

### animation_frame_burst (5 series x 10 frames)

# Perf Report — animation_frame_burst (5 series x 10 frames).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.06ms |
| p95 | 1.37ms |
| p99 | 2.47ms |
| mean | 0.36ms |
| stdev | 0.66ms |
| min | 0.04ms |
| max | 2.75ms |
| total | 7.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.06ms | 0.05ms | +0.01ms | +25.39% |
| p95 | 1.37ms | 0.06ms | +1.31ms | +2194.18% |
| p99 | 2.47ms | 0.07ms | +2.40ms | +3312.53% |
| mean | 0.36ms | 0.05ms | +0.31ms | +626.16% |
| min | 0.04ms | 0.03ms | +0.00ms | +8.99% |
| max | 2.75ms | 0.08ms | +2.67ms | +3534.14% |
| total | 7.15ms | 0.99ms | +6.17ms | +626.16% |

### drilldown_batch (5 hit + 5 miss)

# Perf Report — drilldown_batch (5 hit + 5 miss).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.01ms | +121.44% |
| p95 | 0.03ms | 0.05ms | -0.02ms | -43.85% |
| p99 | 0.03ms | 0.18ms | -0.15ms | -83.41% |
| mean | 0.02ms | 0.03ms | -0.01ms | -20.26% |
| min | 0.02ms | 0.01ms | +0.01ms | +87.49% |
| max | 0.03ms | 0.22ms | -0.19ms | -85.54% |
| total | 0.41ms | 0.51ms | -0.10ms | -20.26% |

### export_batch (3 SVG + 3 PNG)

# Perf Report — export_batch (3 SVG + 3 PNG).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -8.86% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +11.68% |
| p99 | 0.03ms | 0.03ms | +0.01ms | +22.98% |
| mean | 0.02ms | 0.02ms | -0.00ms | -3.84% |
| min | 0.01ms | 0.02ms | -0.00ms | -17.83% |
| max | 0.03ms | 0.03ms | +0.01ms | +25.77% |
| total | 0.36ms | 0.38ms | -0.01ms | -3.84% |

