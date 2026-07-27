# Perf Suite — chart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.07ms | 100ms | PASS | stable |
| axis_recompute_batch (5 dataset で computeAxis) | 0.04ms | 100ms | PASS | stable |
| animation_frame_burst (5 series x 10 frames) | 0.08ms | 100ms | PASS | stable |
| drilldown_batch (5 hit + 5 miss) | 0.03ms | 100ms | PASS | stable |
| export_batch (3 SVG + 3 PNG) | 0.03ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.19ms | 200ms | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 0.09ms | 200ms | PASS |
| animation_frame_burst (5 series x 10 frames) | 0.15ms | 200ms | PASS |
| drilldown_batch (5 hit + 5 miss) | 0.04ms | 200ms | PASS |
| export_batch (3 SVG + 3 PNG) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 10832 B | -15801 B | 102400 B | yes | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 5688 B | 0 B | 102400 B | yes | PASS |
| animation_frame_burst (5 series x 10 frames) | -112 B | 0 B | 102400 B | yes | PASS |
| drilldown_batch (5 hit + 5 miss) | 8392 B | 0 B | 102400 B | yes | PASS |
| export_batch (3 SVG + 3 PNG) | 1800 B | -40960 B | 102400 B | yes | PASS |

## Detailed serial reports

### dashboard_render_workflow (10 chart across 4 kinds x 4 providers)

# Perf Report — dashboard_render_workflow (10 chart across 4 kinds x 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.06ms |
| p95 | 0.07ms |
| p99 | 0.13ms |
| mean | 0.06ms |
| stdev | 0.02ms |
| min | 0.05ms |
| max | 0.14ms |
| total | 1.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.06ms | 0.06ms | +0.00ms | +3.36% |
| p95 | 0.07ms | 0.07ms | +0.00ms | +0.94% |
| p99 | 0.13ms | 0.07ms | +0.05ms | +70.62% |
| mean | 0.06ms | 0.06ms | +0.00ms | +7.90% |
| min | 0.05ms | 0.04ms | +0.00ms | +2.87% |
| max | 0.14ms | 0.07ms | +0.06ms | +87.37% |
| total | 1.21ms | 1.12ms | +0.09ms | +7.90% |

### axis_recompute_batch (5 dataset で computeAxis)

# Perf Report — axis_recompute_batch (5 dataset で computeAxis).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.10ms |
| mean | 0.03ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.12ms |
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +6.64% |
| p95 | 0.04ms | 0.03ms | +0.01ms | +28.36% |
| p99 | 0.10ms | 0.03ms | +0.07ms | +230.43% |
| mean | 0.03ms | 0.02ms | +0.01ms | +30.06% |
| min | 0.02ms | 0.02ms | +0.00ms | +10.82% |
| max | 0.12ms | 0.03ms | +0.09ms | +278.73% |
| total | 0.58ms | 0.44ms | +0.13ms | +30.06% |

### animation_frame_burst (5 series x 10 frames)

# Perf Report — animation_frame_burst (5 series x 10 frames).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.05ms |
| p95 | 0.08ms |
| p99 | 0.09ms |
| mean | 0.05ms |
| stdev | 0.01ms |
| min | 0.04ms |
| max | 0.09ms |
| total | 1.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.04ms | +0.01ms | +32.39% |
| p95 | 0.08ms | 0.06ms | +0.02ms | +41.19% |
| p99 | 0.09ms | 0.06ms | +0.03ms | +44.99% |
| mean | 0.05ms | 0.04ms | +0.01ms | +29.16% |
| min | 0.04ms | 0.03ms | +0.01ms | +23.80% |
| max | 0.09ms | 0.06ms | +0.03ms | +45.87% |
| total | 1.06ms | 0.82ms | +0.24ms | +29.16% |

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
| min | 0.01ms |
| max | 0.03ms |
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -20.02% |
| p95 | 0.03ms | 0.02ms | +0.00ms | +9.16% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +15.11% |
| mean | 0.02ms | 0.02ms | -0.00ms | -9.63% |
| min | 0.01ms | 0.02ms | -0.01ms | -42.33% |
| max | 0.03ms | 0.03ms | +0.00ms | +16.35% |
| total | 0.37ms | 0.41ms | -0.04ms | -9.63% |

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
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +9.71% |
| p95 | 0.03ms | 0.02ms | +0.00ms | +4.36% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -5.28% |
| mean | 0.02ms | 0.02ms | +0.00ms | +11.52% |
| min | 0.01ms | 0.01ms | +0.00ms | +35.17% |
| max | 0.03ms | 0.03ms | -0.00ms | -7.35% |
| total | 0.37ms | 0.33ms | +0.04ms | +11.52% |

