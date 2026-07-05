# Perf Suite — nextjs

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeServerAction | 0.00ms | 5ms | PASS | stable |
| invokeMiddleware | 0.01ms | 5ms | PASS | regressed |
| renderServerComponent | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerAction | 0.02ms | 10ms | PASS |
| invokeMiddleware | 0.09ms | 10ms | PASS |
| renderServerComponent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| invokeServerAction | 708600 B | 0 B | 102400 B | PASS |
| invokeMiddleware | -7021000 B | -40679 B | 102400 B | PASS |
| renderServerComponent | 378400 B | 0 B | 102400 B | PASS |

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
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +60.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -20.42% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -4.31% |
| mean | 0.00ms | 0.00ms | +0.00ms | +26.60% |
| min | 0.00ms | 0.00ms | +0.00ms | +69.00% |
| max | 0.02ms | 0.02ms | +0.01ms | +33.49% |
| total | 0.26ms | 0.20ms | +0.05ms | +26.60% |

### invokeMiddleware

# Perf Report — invokeMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 1.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +27.03% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +37.82% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -3.76% |
| mean | 0.01ms | 0.01ms | +0.00ms | +25.05% |
| min | 0.01ms | 0.00ms | +0.00ms | +24.02% |
| max | 0.02ms | 0.02ms | +0.01ms | +25.64% |
| total | 1.33ms | 1.07ms | +0.27ms | +25.05% |

### renderServerComponent

# Perf Report — renderServerComponent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +19.90% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +21.23% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +1.34% |
| mean | 0.00ms | 0.00ms | +0.00ms | +16.76% |
| min | 0.00ms | 0.00ms | +0.00ms | +22.13% |
| max | 0.01ms | 0.01ms | -0.00ms | -22.59% |
| total | 0.12ms | 0.10ms | +0.02ms | +16.76% |

