# Perf Suite — fresh

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeFreshHandler | 0.02ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +1837%) 以上の悪化が必要) |
| mountIsland | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +21785%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeFreshHandler | 0.14ms | 10ms | PASS |
| mountIsland | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeFreshHandler | 150264 B | 0 B | 102400 B | yes | PASS |
| mountIsland | -97856 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeFreshHandler

# Perf Report — invokeFreshHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.12ms |
| total | 2.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -4.38% |
| p95 | 0.02ms | 0.03ms | -0.00ms | -13.83% |
| p99 | 0.05ms | 0.11ms | -0.06ms | -52.73% |
| mean | 0.01ms | 0.02ms | -0.00ms | -13.30% |
| min | 0.01ms | 0.01ms | -0.00ms | -10.14% |
| max | 0.12ms | 0.39ms | -0.27ms | -68.90% |
| total | 2.67ms | 3.08ms | -0.41ms | -13.30% |

### mountIsland

# Perf Report — mountIsland.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -19.54% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -16.34% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -33.24% |
| mean | 0.00ms | 0.00ms | -0.00ms | -16.07% |
| min | 0.00ms | 0.00ms | -0.00ms | -6.04% |
| max | 0.01ms | 0.01ms | -0.00ms | -2.22% |
| total | 0.32ms | 0.39ms | -0.06ms | -16.07% |

