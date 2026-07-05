# Perf Suite — fresh

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeFreshHandler | 0.09ms | 5ms | PASS | stable |
| mountIsland | 0.01ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeFreshHandler | 0.24ms | 10ms | PASS |
| mountIsland | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| invokeFreshHandler | 2088728 B | 400 B | 102400 B | PASS |
| mountIsland | -186288 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### invokeFreshHandler

# Perf Report — invokeFreshHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.09ms |
| p99 | 0.37ms |
| mean | 0.05ms |
| stdev | 0.35ms |
| min | 0.01ms |
| max | 4.71ms |
| total | 10.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -3.49% |
| p95 | 0.09ms | 0.02ms | +0.07ms | +319.23% |
| p99 | 0.37ms | 0.05ms | +0.32ms | +635.32% |
| mean | 0.05ms | 0.01ms | +0.04ms | +317.41% |
| min | 0.01ms | 0.01ms | +0.00ms | +12.92% |
| max | 4.71ms | 0.10ms | +4.61ms | +4572.08% |
| total | 10.79ms | 2.58ms | +8.20ms | +317.41% |

### mountIsland

# Perf Report — mountIsland.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.04ms |
| mean | 0.00ms |
| stdev | 0.02ms |
| min | 0.00ms |
| max | 0.22ms |
| total | 0.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -9.72% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +91.45% |
| p99 | 0.04ms | 0.01ms | +0.04ms | +539.51% |
| mean | 0.00ms | 0.00ms | +0.00ms | +99.63% |
| min | 0.00ms | 0.00ms | +0.00ms | +2.98% |
| max | 0.22ms | 0.02ms | +0.20ms | +1145.29% |
| total | 0.85ms | 0.42ms | +0.42ms | +99.63% |

