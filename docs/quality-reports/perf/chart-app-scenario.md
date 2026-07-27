# Perf Suite — chart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.07ms | 100ms | PASS | stable |
| axis_recompute_batch (5 dataset で computeAxis) | 0.03ms | 100ms | PASS | stable |
| animation_frame_burst (5 series x 10 frames) | 0.06ms | 100ms | PASS | stable |
| drilldown_batch (5 hit + 5 miss) | 0.03ms | 100ms | PASS | stable |
| export_batch (3 SVG + 3 PNG) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.23ms | 200ms | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 0.09ms | 200ms | PASS |
| animation_frame_burst (5 series x 10 frames) | 0.15ms | 200ms | PASS |
| drilldown_batch (5 hit + 5 miss) | 0.04ms | 200ms | PASS |
| export_batch (3 SVG + 3 PNG) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 4072 B | 0 B | 102400 B | yes | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | -20344 B | 0 B | 102400 B | yes | PASS |
| animation_frame_burst (5 series x 10 frames) | 816 B | 0 B | 102400 B | yes | PASS |
| drilldown_batch (5 hit + 5 miss) | 1960 B | 0 B | 102400 B | yes | PASS |
| export_batch (3 SVG + 3 PNG) | 360 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dashboard_render_workflow (10 chart across 4 kinds x 4 providers)

# Perf Report — dashboard_render_workflow (10 chart across 4 kinds x 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.06ms |
| p95 | 0.07ms |
| p99 | 0.12ms |
| mean | 0.06ms |
| stdev | 0.02ms |
| min | 0.05ms |
| max | 0.14ms |
| total | 1.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.06ms | 0.06ms | +0.00ms | +0.87% |
| p95 | 0.07ms | 0.07ms | +0.00ms | +3.40% |
| p99 | 0.12ms | 0.07ms | +0.05ms | +67.98% |
| mean | 0.06ms | 0.06ms | +0.00ms | +6.25% |
| min | 0.05ms | 0.04ms | +0.00ms | +3.33% |
| max | 0.14ms | 0.07ms | +0.06ms | +83.49% |
| total | 1.19ms | 1.12ms | +0.07ms | +6.25% |

### axis_recompute_batch (5 dataset で computeAxis)

# Perf Report — axis_recompute_batch (5 dataset で computeAxis).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +7.88% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +8.29% |
| p99 | 0.04ms | 0.03ms | +0.00ms | +12.05% |
| mean | 0.02ms | 0.02ms | +0.00ms | +10.86% |
| min | 0.02ms | 0.02ms | +0.00ms | +5.88% |
| max | 0.04ms | 0.03ms | +0.00ms | +12.94% |
| total | 0.49ms | 0.44ms | +0.05ms | +10.86% |

### animation_frame_burst (5 series x 10 frames)

# Perf Report — animation_frame_burst (5 series x 10 frames).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.06ms |
| p99 | 0.07ms |
| mean | 0.05ms |
| stdev | 0.01ms |
| min | 0.04ms |
| max | 0.07ms |
| total | 0.93ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.00ms | +11.13% |
| p95 | 0.06ms | 0.06ms | +0.01ms | +11.79% |
| p99 | 0.07ms | 0.06ms | +0.01ms | +9.65% |
| mean | 0.05ms | 0.04ms | +0.01ms | +12.85% |
| min | 0.04ms | 0.03ms | +0.01ms | +28.45% |
| max | 0.07ms | 0.06ms | +0.01ms | +9.16% |
| total | 0.93ms | 0.82ms | +0.11ms | +12.85% |

### drilldown_batch (5 hit + 5 miss)

# Perf Report — drilldown_batch (5 hit + 5 miss).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.01ms | -44.83% |
| p95 | 0.03ms | 0.02ms | +0.00ms | +8.93% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +14.11% |
| mean | 0.01ms | 0.02ms | -0.01ms | -36.49% |
| min | 0.01ms | 0.02ms | -0.01ms | -52.91% |
| max | 0.03ms | 0.03ms | +0.00ms | +15.18% |
| total | 0.26ms | 0.41ms | -0.15ms | -36.49% |

### export_batch (3 SVG + 3 PNG)

# Perf Report — export_batch (3 SVG + 3 PNG).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.00ms | -10.77% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -9.42% |
| p99 | 0.02ms | 0.03ms | -0.00ms | -17.56% |
| mean | 0.02ms | 0.02ms | -0.00ms | -6.29% |
| min | 0.01ms | 0.01ms | +0.00ms | +26.87% |
| max | 0.02ms | 0.03ms | -0.01ms | -19.31% |
| total | 0.31ms | 0.33ms | -0.02ms | -6.29% |

