# Perf Suite — solidstart

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeServerFunction | 0.00ms | 5ms | PASS | stable |
| invokeApiRoute | 0.02ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerFunction | 0.01ms | 10ms | PASS |
| invokeApiRoute | 0.14ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerFunction | -504 B | 0 B | 102400 B | yes | PASS |
| invokeApiRoute | 2176 B | -22 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeServerFunction

# Perf Report — invokeServerFunction.serial

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
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.20% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -7.83% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -17.13% |
| mean | 0.00ms | 0.00ms | -0.00ms | -15.51% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.86% |
| max | 0.01ms | 0.02ms | -0.01ms | -39.16% |
| total | 0.15ms | 0.17ms | -0.03ms | -15.51% |

### invokeApiRoute

# Perf Report — invokeApiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.10ms |
| total | 2.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -9.14% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +2.72% |
| p99 | 0.06ms | 0.06ms | -0.00ms | -6.29% |
| mean | 0.01ms | 0.01ms | -0.00ms | -4.11% |
| min | 0.01ms | 0.01ms | -0.00ms | -2.31% |
| max | 0.10ms | 0.10ms | -0.01ms | -4.94% |
| total | 2.70ms | 2.82ms | -0.12ms | -4.11% |

