# Perf Suite — nextjs

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeServerAction | 0.00ms | 5ms | PASS | stable |
| invokeMiddleware | 0.01ms | 5ms | PASS | stable |
| renderServerComponent | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerAction | 0.02ms | 10ms | PASS |
| invokeMiddleware | 0.07ms | 10ms | PASS |
| renderServerComponent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerAction | -12384 B | 0 B | 102400 B | yes | PASS |
| invokeMiddleware | -11384 B | 0 B | 102400 B | yes | PASS |
| renderServerComponent | -14936 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeServerAction

# Perf Report — invokeServerAction.serial

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
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -5.79% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +7.52% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -5.92% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.95% |
| min | 0.00ms | 0.00ms | +0.00ms | +7.76% |
| max | 0.02ms | 0.02ms | -0.00ms | -8.61% |
| total | 0.22ms | 0.21ms | +0.00ms | +1.95% |

### invokeMiddleware

# Perf Report — invokeMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.00ms |
| max | 0.23ms |
| total | 1.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +3.52% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -17.59% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -26.51% |
| mean | 0.01ms | 0.01ms | +0.00ms | +10.78% |
| min | 0.00ms | 0.00ms | +0.00ms | +3.68% |
| max | 0.23ms | 0.08ms | +0.15ms | +195.21% |
| total | 1.33ms | 1.20ms | +0.13ms | +10.78% |

### renderServerComponent

# Perf Report — renderServerComponent.serial

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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.95% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +4.95% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +98.26% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.75% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +12.50% |
| total | 0.12ms | 0.12ms | +0.01ms | +5.75% |

