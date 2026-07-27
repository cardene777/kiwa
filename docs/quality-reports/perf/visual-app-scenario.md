# Perf Suite — visual-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.03ms | 30ms | PASS | stable |
| burst_compare (5 different 10x10 diff) | 0.06ms | 100ms | PASS | stable |
| large_image_diff (100x100 png) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 2, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.03ms | 60ms | PASS |
| burst_compare (5 different 10x10 diff) | 0.10ms | 200ms | PASS |
| large_image_diff (100x100 png) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 225632 B | 0 B | 102400 B | PASS |
| burst_compare (5 different 10x10 diff) | -5367824 B | 0 B | 102400 B | PASS |
| large_image_diff (100x100 png) | 221296 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### baseline_compare (identical 10x10 png)

# Perf Report — baseline_compare (identical 10x10 png).serial

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
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -10.90% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +68.56% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +69.26% |
| mean | 0.01ms | 0.01ms | +0.00ms | +10.70% |
| min | 0.01ms | 0.01ms | +0.00ms | +15.02% |
| max | 0.03ms | 0.02ms | +0.01ms | +69.42% |
| total | 0.27ms | 0.24ms | +0.03ms | +10.70% |

### burst_compare (5 different 10x10 diff)

# Perf Report — burst_compare (5 different 10x10 diff).serial

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
| total | 0.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.00ms | +2.97% |
| p95 | 0.06ms | 0.07ms | -0.01ms | -9.63% |
| p99 | 0.07ms | 0.08ms | -0.01ms | -13.76% |
| mean | 0.05ms | 0.05ms | -0.00ms | -1.68% |
| min | 0.04ms | 0.04ms | +0.00ms | +4.80% |
| max | 0.07ms | 0.08ms | -0.01ms | -14.65% |
| total | 0.90ms | 0.92ms | -0.02ms | -1.68% |

### large_image_diff (100x100 png)

# Perf Report — large_image_diff (100x100 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.01ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +1.73% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -3.72% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -9.94% |
| mean | 0.01ms | 0.01ms | -0.00ms | -1.01% |
| min | 0.01ms | 0.01ms | +0.00ms | +2.97% |
| max | 0.01ms | 0.02ms | -0.00ms | -11.35% |
| total | 0.19ms | 0.19ms | -0.00ms | -1.01% |

