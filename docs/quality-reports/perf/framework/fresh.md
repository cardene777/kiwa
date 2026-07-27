# Perf Suite — fresh

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeFreshHandler | 0.02ms | 5ms | PASS | stable |
| mountIsland | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeFreshHandler | 0.13ms | 10ms | PASS |
| mountIsland | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeFreshHandler | 3016 B | -4 B | 102400 B | yes | PASS |
| mountIsland | 1296 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeFreshHandler

# Perf Report — invokeFreshHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.11ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.14ms |
| total | 2.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -16.05% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -3.64% |
| p99 | 0.11ms | 0.06ms | +0.05ms | +82.47% |
| mean | 0.01ms | 0.01ms | -0.00ms | -10.41% |
| min | 0.01ms | 0.01ms | -0.00ms | -18.98% |
| max | 0.14ms | 0.11ms | +0.02ms | +20.94% |
| total | 2.49ms | 2.78ms | -0.29ms | -10.41% |

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
| max | 0.02ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -16.21% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -26.38% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -41.15% |
| mean | 0.00ms | 0.00ms | -0.00ms | -18.25% |
| min | 0.00ms | 0.00ms | -0.00ms | -19.47% |
| max | 0.02ms | 0.02ms | +0.00ms | +15.30% |
| total | 0.31ms | 0.38ms | -0.07ms | -18.25% |

