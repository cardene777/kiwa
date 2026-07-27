# Perf Suite — fresh

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeFreshHandler | 0.02ms | 5ms | PASS | stable |
| mountIsland | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeFreshHandler | 0.14ms | 10ms | PASS |
| mountIsland | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeFreshHandler | -143072 B | -4 B | 102400 B | yes | PASS |
| mountIsland | 1312 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.10ms |
| total | 2.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -14.12% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -13.11% |
| p99 | 0.05ms | 0.06ms | -0.00ms | -7.31% |
| mean | 0.01ms | 0.01ms | -0.00ms | -14.48% |
| min | 0.01ms | 0.01ms | -0.00ms | -14.36% |
| max | 0.10ms | 0.11ms | -0.02ms | -14.37% |
| total | 2.38ms | 2.78ms | -0.40ms | -14.48% |

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
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -16.21% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -24.53% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -32.30% |
| mean | 0.00ms | 0.00ms | -0.00ms | -20.02% |
| min | 0.00ms | 0.00ms | -0.00ms | -16.67% |
| max | 0.01ms | 0.02ms | -0.01ms | -27.59% |
| total | 0.31ms | 0.38ms | -0.08ms | -20.02% |

