# Perf Suite — chart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.07ms | 100ms | PASS | stable |
| axis_recompute_batch (5 dataset で computeAxis) | 0.02ms | 100ms | PASS | stable |
| animation_frame_burst (5 series x 10 frames) | 0.05ms | 100ms | PASS | n/a (baseline seeded) |
| drilldown_batch (5 hit + 5 miss) | 0.02ms | 100ms | PASS | n/a (baseline seeded) |
| export_batch (3 SVG + 3 PNG) | 0.02ms | 100ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.18ms | 200ms | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 0.07ms | 200ms | PASS |
| animation_frame_burst (5 series x 10 frames) | 0.23ms | 200ms | PASS |
| drilldown_batch (5 hit + 5 miss) | 0.04ms | 200ms | PASS |
| export_batch (3 SVG + 3 PNG) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | -5550128 B | -11821 B | 102400 B | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 747128 B | 0 B | 102400 B | PASS |
| animation_frame_burst (5 series x 10 frames) | 2967848 B | 0 B | 102400 B | PASS |
| drilldown_batch (5 hit + 5 miss) | -7340128 B | 0 B | 102400 B | PASS |
| export_batch (3 SVG + 3 PNG) | 802776 B | 24576 B | 102400 B | PASS |

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
| mean | 0.06ms |
| stdev | 0.01ms |
| min | 0.05ms |
| max | 0.08ms |
| total | 1.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.05ms | +0.00ms | +0.54% |
| p95 | 0.07ms | 0.07ms | +0.00ms | +0.27% |
| p99 | 0.07ms | 0.07ms | +0.00ms | +0.50% |
| mean | 0.06ms | 0.06ms | -0.00ms | -0.37% |
| min | 0.05ms | 0.05ms | -0.00ms | -1.76% |
| max | 0.08ms | 0.08ms | +0.00ms | +0.55% |
| total | 1.11ms | 1.12ms | -0.00ms | -0.37% |

### axis_recompute_batch (5 dataset で computeAxis)

# Perf Report — axis_recompute_batch (5 dataset で computeAxis).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -4.70% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -20.17% |
| p99 | 0.03ms | 0.03ms | -0.01ms | -18.34% |
| mean | 0.02ms | 0.02ms | -0.00ms | -7.20% |
| min | 0.01ms | 0.02ms | -0.00ms | -3.74% |
| max | 0.03ms | 0.04ms | -0.01ms | -17.95% |
| total | 0.36ms | 0.39ms | -0.03ms | -7.20% |

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
| max | 0.06ms |
| total | 0.73ms |

### drilldown_batch (5 hit + 5 miss)

# Perf Report — drilldown_batch (5 hit + 5 miss).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.24ms |

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
| total | 0.28ms |

