# Perf Suite — chart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.07ms | 100ms | PASS | stable (差 0.15ms が下限 0.5ms 未満で判定を保留) |
| axis_recompute_batch (5 dataset で computeAxis) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1503%) 以上の悪化が必要) |
| animation_frame_burst (5 series x 10 frames) | 0.06ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +835%) 以上の悪化が必要) |
| drilldown_batch (5 hit + 5 miss) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1074%) 以上の悪化が必要) |
| export_batch (3 SVG + 3 PNG) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1956%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 1.00ms | 200ms | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 0.10ms | 200ms | PASS |
| animation_frame_burst (5 series x 10 frames) | 0.18ms | 200ms | PASS |
| drilldown_batch (5 hit + 5 miss) | 0.04ms | 200ms | PASS |
| export_batch (3 SVG + 3 PNG) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 208 B | 0 B | 102400 B | yes | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | -704 B | 0 B | 102400 B | yes | PASS |
| animation_frame_burst (5 series x 10 frames) | 616 B | 0 B | 102400 B | yes | PASS |
| drilldown_batch (5 hit + 5 miss) | 2384 B | 0 B | 102400 B | yes | PASS |
| export_batch (3 SVG + 3 PNG) | 1528 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dashboard_render_workflow (10 chart across 4 kinds x 4 providers)

# Perf Report — dashboard_render_workflow (10 chart across 4 kinds x 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.06ms |
| p95 | 0.07ms |
| p99 | 0.07ms |
| mean | 0.06ms |
| stdev | 0.01ms |
| min | 0.05ms |
| max | 0.07ms |
| total | 1.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.06ms | 0.07ms | -0.02ms | -23.32% |
| p95 | 0.07ms | 0.22ms | -0.15ms | -69.38% |
| p99 | 0.07ms | 0.23ms | -0.16ms | -69.00% |
| mean | 0.06ms | 0.10ms | -0.05ms | -44.85% |
| min | 0.05ms | 0.06ms | -0.01ms | -21.20% |
| max | 0.07ms | 0.24ms | -0.16ms | -68.91% |
| total | 1.14ms | 2.06ms | -0.92ms | -44.85% |

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
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +3.08% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -2.20% |
| p99 | 0.04ms | 0.03ms | +0.00ms | +7.91% |
| mean | 0.02ms | 0.02ms | -0.00ms | -0.70% |
| min | 0.02ms | 0.02ms | -0.00ms | -1.94% |
| max | 0.04ms | 0.03ms | +0.00ms | +10.37% |
| total | 0.47ms | 0.47ms | -0.00ms | -0.70% |

### animation_frame_burst (5 series x 10 frames)

# Perf Report — animation_frame_burst (5 series x 10 frames).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.06ms |
| p99 | 0.06ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.06ms |
| total | 0.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.05ms | -0.01ms | -16.90% |
| p95 | 0.06ms | 0.06ms | -0.00ms | -3.46% |
| p99 | 0.06ms | 0.07ms | -0.01ms | -16.63% |
| mean | 0.04ms | 0.05ms | -0.01ms | -16.82% |
| min | 0.03ms | 0.03ms | -0.00ms | -2.46% |
| max | 0.06ms | 0.08ms | -0.01ms | -19.24% |
| total | 0.82ms | 0.99ms | -0.17ms | -16.82% |

### drilldown_batch (5 hit + 5 miss)

# Perf Report — drilldown_batch (5 hit + 5 miss).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.01ms | +62.07% |
| p95 | 0.02ms | 0.05ms | -0.02ms | -51.58% |
| p99 | 0.03ms | 0.18ms | -0.15ms | -84.81% |
| mean | 0.02ms | 0.03ms | -0.01ms | -41.62% |
| min | 0.01ms | 0.01ms | -0.00ms | -16.35% |
| max | 0.03ms | 0.22ms | -0.19ms | -86.60% |
| total | 0.30ms | 0.51ms | -0.21ms | -41.62% |

### export_batch (3 SVG + 3 PNG)

# Perf Report — export_batch (3 SVG + 3 PNG).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.00ms | -25.55% |
| p95 | 0.02ms | 0.03ms | -0.00ms | -4.27% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +5.09% |
| mean | 0.02ms | 0.02ms | -0.00ms | -15.76% |
| min | 0.01ms | 0.02ms | -0.00ms | -24.34% |
| max | 0.03ms | 0.03ms | +0.00ms | +7.41% |
| total | 0.32ms | 0.38ms | -0.06ms | -15.76% |

