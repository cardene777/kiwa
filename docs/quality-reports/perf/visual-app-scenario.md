# Perf Suite — visual-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.03ms | 30ms | PASS | stable (検知には +0.5ms (baseline 比 +1943%) 以上の悪化が必要) |
| burst_compare (5 different 10x10 diff) | 0.09ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +636%) 以上の悪化が必要) |
| large_image_diff (100x100 png) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2733%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 2, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.06ms | 60ms | PASS |
| burst_compare (5 different 10x10 diff) | 0.17ms | 200ms | PASS |
| large_image_diff (100x100 png) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 90616 B | 0 B | 102400 B | yes | PASS |
| burst_compare (5 different 10x10 diff) | 478224 B | 0 B | 102400 B | yes | PASS |
| large_image_diff (100x100 png) | 96440 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.04ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -3.53% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +14.07% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +16.13% |
| mean | 0.01ms | 0.01ms | +0.00ms | +7.64% |
| min | 0.01ms | 0.01ms | -0.00ms | -2.88% |
| max | 0.04ms | 0.03ms | +0.01ms | +16.55% |
| total | 0.30ms | 0.28ms | +0.02ms | +7.64% |

### burst_compare (5 different 10x10 diff)

# Perf Report — burst_compare (5 different 10x10 diff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.05ms |
| p95 | 0.09ms |
| p99 | 0.11ms |
| mean | 0.06ms |
| stdev | 0.02ms |
| min | 0.04ms |
| max | 0.12ms |
| total | 1.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.05ms | -0.00ms | -6.29% |
| p95 | 0.09ms | 0.08ms | +0.01ms | +8.23% |
| p99 | 0.11ms | 0.14ms | -0.03ms | -19.03% |
| mean | 0.06ms | 0.06ms | -0.00ms | -6.48% |
| min | 0.04ms | 0.05ms | -0.01ms | -12.04% |
| max | 0.12ms | 0.16ms | -0.04ms | -22.42% |
| total | 1.14ms | 1.22ms | -0.08ms | -6.48% |

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
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +7.30% |
| p95 | 0.01ms | 0.02ms | -0.01ms | -31.45% |
| p99 | 0.01ms | 0.03ms | -0.02ms | -61.41% |
| mean | 0.01ms | 0.01ms | -0.00ms | -10.65% |
| min | 0.01ms | 0.01ms | +0.00ms | +7.65% |
| max | 0.01ms | 0.04ms | -0.02ms | -64.99% |
| total | 0.21ms | 0.23ms | -0.02ms | -10.65% |

