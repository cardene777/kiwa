# Perf Suite — chart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.07ms | 100ms | PASS | stable |
| axis_recompute_batch (5 dataset で computeAxis) | 0.03ms | 100ms | PASS | stable |
| animation_frame_burst (5 series x 10 frames) | 0.05ms | 100ms | PASS | stable |
| drilldown_batch (5 hit + 5 miss) | 0.02ms | 100ms | PASS | stable |
| export_batch (3 SVG + 3 PNG) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.25ms | 200ms | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 0.09ms | 200ms | PASS |
| animation_frame_burst (5 series x 10 frames) | 0.15ms | 200ms | PASS |
| drilldown_batch (5 hit + 5 miss) | 0.04ms | 200ms | PASS |
| export_batch (3 SVG + 3 PNG) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | -3496 B | 0 B | 102400 B | yes | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 5752 B | 0 B | 102400 B | yes | PASS |
| animation_frame_burst (5 series x 10 frames) | 816 B | 0 B | 102400 B | yes | PASS |
| drilldown_batch (5 hit + 5 miss) | 6480 B | 0 B | 102400 B | yes | PASS |
| export_batch (3 SVG + 3 PNG) | 1832 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dashboard_render_workflow (10 chart across 4 kinds x 4 providers)

# Perf Report — dashboard_render_workflow (10 chart across 4 kinds x 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.05ms |
| p95 | 0.07ms |
| p99 | 0.07ms |
| mean | 0.05ms |
| stdev | 0.01ms |
| min | 0.05ms |
| max | 0.08ms |
| total | 1.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.06ms | -0.00ms | -2.03% |
| p95 | 0.07ms | 0.07ms | -0.00ms | -4.82% |
| p99 | 0.07ms | 0.07ms | +0.00ms | +0.06% |
| mean | 0.05ms | 0.06ms | -0.00ms | -2.78% |
| min | 0.05ms | 0.04ms | +0.00ms | +1.02% |
| max | 0.08ms | 0.07ms | +0.00ms | +1.24% |
| total | 1.09ms | 1.12ms | -0.03ms | -2.78% |

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
| total | 0.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +7.25% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -3.18% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -1.15% |
| mean | 0.02ms | 0.02ms | +0.00ms | +3.33% |
| min | 0.02ms | 0.02ms | +0.00ms | +7.05% |
| max | 0.03ms | 0.03ms | -0.00ms | -0.66% |
| total | 0.46ms | 0.44ms | +0.01ms | +3.33% |

### animation_frame_burst (5 series x 10 frames)

# Perf Report — animation_frame_burst (5 series x 10 frames).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.00ms | -0.10% |
| p95 | 0.05ms | 0.06ms | -0.00ms | -5.90% |
| p99 | 0.05ms | 0.06ms | -0.01ms | -9.78% |
| mean | 0.04ms | 0.04ms | -0.00ms | -2.18% |
| min | 0.03ms | 0.03ms | +0.00ms | +9.16% |
| max | 0.05ms | 0.06ms | -0.01ms | -10.67% |
| total | 0.80ms | 0.82ms | -0.02ms | -2.18% |

### drilldown_batch (5 hit + 5 miss)

# Perf Report — drilldown_batch (5 hit + 5 miss).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.01ms | -29.31% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +4.61% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +2.12% |
| mean | 0.01ms | 0.02ms | -0.01ms | -33.32% |
| min | 0.01ms | 0.02ms | -0.01ms | -53.43% |
| max | 0.03ms | 0.03ms | +0.00ms | +1.60% |
| total | 0.27ms | 0.41ms | -0.14ms | -33.32% |

### export_batch (3 SVG + 3 PNG)

# Perf Report — export_batch (3 SVG + 3 PNG).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.00ms | -13.57% |
| p95 | 0.02ms | 0.02ms | -0.01ms | -27.85% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -28.53% |
| mean | 0.01ms | 0.02ms | -0.00ms | -12.34% |
| min | 0.01ms | 0.01ms | +0.00ms | +22.13% |
| max | 0.02ms | 0.03ms | -0.01ms | -28.68% |
| total | 0.29ms | 0.33ms | -0.04ms | -12.34% |

