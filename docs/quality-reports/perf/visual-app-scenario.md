# Perf Suite — visual-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.02ms | 30ms | PASS | stable |
| burst_compare (5 different 10x10 diff) | 0.07ms | 100ms | PASS | stable |
| large_image_diff (100x100 png) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 2, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.02ms | 60ms | PASS |
| burst_compare (5 different 10x10 diff) | 0.11ms | 200ms | PASS |
| large_image_diff (100x100 png) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 90400 B | 0 B | 102400 B | yes | PASS |
| burst_compare (5 different 10x10 diff) | 482248 B | 0 B | 102400 B | yes | PASS |
| large_image_diff (100x100 png) | 98040 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### baseline_compare (identical 10x10 png)

# Perf Report — baseline_compare (identical 10x10 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.03ms | -0.02ms | -59.05% |
| p95 | 0.02ms | 0.06ms | -0.04ms | -63.99% |
| p99 | 0.03ms | 0.07ms | -0.04ms | -60.03% |
| mean | 0.01ms | 0.03ms | -0.02ms | -61.14% |
| min | 0.01ms | 0.02ms | -0.01ms | -57.78% |
| max | 0.03ms | 0.08ms | -0.04ms | -59.30% |
| total | 0.25ms | 0.64ms | -0.39ms | -61.14% |

### burst_compare (5 different 10x10 diff)

# Perf Report — burst_compare (5 different 10x10 diff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.05ms |
| p95 | 0.07ms |
| p99 | 0.08ms |
| mean | 0.05ms |
| stdev | 0.01ms |
| min | 0.04ms |
| max | 0.08ms |
| total | 1.00ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.05ms | +0.00ms | +0.70% |
| p95 | 0.07ms | 0.06ms | +0.01ms | +20.59% |
| p99 | 0.08ms | 0.06ms | +0.01ms | +23.17% |
| mean | 0.05ms | 0.05ms | +0.00ms | +2.82% |
| min | 0.04ms | 0.04ms | -0.00ms | -1.29% |
| max | 0.08ms | 0.06ms | +0.01ms | +23.79% |
| total | 1.00ms | 0.97ms | +0.03ms | +2.82% |

### large_image_diff (100x100 png)

# Perf Report — large_image_diff (100x100 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.01ms | -61.07% |
| p95 | 0.01ms | 0.09ms | -0.08ms | -84.50% |
| p99 | 0.02ms | 0.16ms | -0.14ms | -86.74% |
| mean | 0.01ms | 0.04ms | -0.03ms | -73.61% |
| min | 0.01ms | 0.02ms | -0.01ms | -61.57% |
| max | 0.02ms | 0.18ms | -0.16ms | -87.01% |
| total | 0.20ms | 0.75ms | -0.55ms | -73.61% |

