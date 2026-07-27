# Perf Suite — solidstart

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeServerFunction | 0.00ms | 5ms | PASS | stable |
| invokeApiRoute | 0.03ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerFunction | 0.01ms | 10ms | PASS |
| invokeApiRoute | 0.14ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerFunction | 6032 B | 0 B | 102400 B | yes | PASS |
| invokeApiRoute | 3280 B | -22 B | 102400 B | yes | PASS |

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
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.03% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -7.43% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -12.49% |
| mean | 0.00ms | 0.00ms | -0.00ms | -10.94% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.02ms | -0.01ms | -32.30% |
| total | 0.16ms | 0.17ms | -0.02ms | -10.94% |

### invokeApiRoute

# Perf Report — invokeApiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.11ms |
| total | 2.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -9.50% |
| p95 | 0.03ms | 0.02ms | +0.00ms | +10.03% |
| p99 | 0.07ms | 0.06ms | +0.01ms | +12.54% |
| mean | 0.01ms | 0.01ms | -0.00ms | -0.44% |
| min | 0.01ms | 0.01ms | -0.00ms | -0.46% |
| max | 0.11ms | 0.10ms | +0.00ms | +4.17% |
| total | 2.81ms | 2.82ms | -0.01ms | -0.44% |

