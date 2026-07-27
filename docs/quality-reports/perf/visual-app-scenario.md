# Perf Suite — visual-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.02ms | 30ms | PASS | stable |
| burst_compare (5 different 10x10 diff) | 0.07ms | 100ms | PASS | stable |
| large_image_diff (100x100 png) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 2, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.02ms | 60ms | PASS |
| burst_compare (5 different 10x10 diff) | 0.10ms | 200ms | PASS |
| large_image_diff (100x100 png) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 90400 B | 0 B | 102400 B | yes | PASS |
| burst_compare (5 different 10x10 diff) | 483544 B | 0 B | 102400 B | yes | PASS |
| large_image_diff (100x100 png) | 99560 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.03ms | -0.02ms | -60.00% |
| p95 | 0.02ms | 0.06ms | -0.04ms | -69.48% |
| p99 | 0.03ms | 0.07ms | -0.05ms | -64.54% |
| mean | 0.01ms | 0.03ms | -0.02ms | -62.67% |
| min | 0.01ms | 0.02ms | -0.01ms | -57.58% |
| max | 0.03ms | 0.08ms | -0.05ms | -63.63% |
| total | 0.24ms | 0.64ms | -0.40ms | -62.67% |

### burst_compare (5 different 10x10 diff)

# Perf Report — burst_compare (5 different 10x10 diff).serial

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
| max | 0.07ms |
| total | 1.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.05ms | +0.00ms | +1.48% |
| p95 | 0.07ms | 0.06ms | +0.01ms | +23.48% |
| p99 | 0.07ms | 0.06ms | +0.01ms | +20.46% |
| mean | 0.05ms | 0.05ms | +0.00ms | +8.87% |
| min | 0.05ms | 0.04ms | +0.00ms | +9.68% |
| max | 0.07ms | 0.06ms | +0.01ms | +19.75% |
| total | 1.05ms | 0.97ms | +0.09ms | +8.87% |

### large_image_diff (100x100 png)

# Perf Report — large_image_diff (100x100 png).serial

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
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.01ms | -51.94% |
| p95 | 0.02ms | 0.09ms | -0.07ms | -80.46% |
| p99 | 0.02ms | 0.16ms | -0.14ms | -88.52% |
| mean | 0.01ms | 0.04ms | -0.03ms | -69.41% |
| min | 0.01ms | 0.02ms | -0.01ms | -55.93% |
| max | 0.02ms | 0.18ms | -0.16ms | -89.51% |
| total | 0.23ms | 0.75ms | -0.52ms | -69.41% |

