# Perf Suite — solidstart

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeServerFunction | 0.00ms | 5ms | PASS | stable |
| invokeApiRoute | 0.03ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerFunction | 0.01ms | 10ms | PASS |
| invokeApiRoute | 0.13ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerFunction | -5584 B | 0 B | 102400 B | yes | PASS |
| invokeApiRoute | 51368 B | -22 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -1.93% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -7.13% |
| mean | 0.00ms | 0.00ms | -0.00ms | -7.84% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.02ms | -0.00ms | -22.78% |
| total | 0.16ms | 0.17ms | -0.01ms | -7.84% |

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
| max | 0.10ms |
| total | 2.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -6.99% |
| p95 | 0.03ms | 0.02ms | +0.00ms | +13.70% |
| p99 | 0.07ms | 0.06ms | +0.00ms | +7.59% |
| mean | 0.01ms | 0.01ms | -0.00ms | -0.45% |
| min | 0.01ms | 0.01ms | +0.00ms | +0.92% |
| max | 0.10ms | 0.10ms | +0.00ms | +0.16% |
| total | 2.81ms | 2.82ms | -0.01ms | -0.45% |

