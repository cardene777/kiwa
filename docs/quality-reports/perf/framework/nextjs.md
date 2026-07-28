# Perf Suite — nextjs

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeServerAction | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +11856%) 以上の悪化が必要) |
| invokeMiddleware | 0.01ms | 5ms | PASS | stable (差 0.01ms が下限 0.5ms 未満で判定を保留) |
| renderServerComponent | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +59510%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerAction | 0.02ms | 10ms | PASS |
| invokeMiddleware | 0.07ms | 10ms | PASS |
| renderServerComponent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerAction | -10168 B | 0 B | 102400 B | yes | PASS |
| invokeMiddleware | -28432 B | 0 B | 102400 B | yes | PASS |
| renderServerComponent | -1544 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.03ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.15% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -45.77% |
| p99 | 0.01ms | 0.06ms | -0.05ms | -80.08% |
| mean | 0.00ms | 0.00ms | -0.00ms | -71.05% |
| min | 0.00ms | 0.00ms | -0.00ms | -13.44% |
| max | 0.03ms | 0.41ms | -0.38ms | -93.68% |
| total | 0.23ms | 0.80ms | -0.57ms | -71.05% |

### invokeMiddleware

# Perf Report — invokeMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 1.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.01ms | -0.00ms | -5.56% |
| p95 | 0.01ms | 0.01ms | -0.01ms | -51.34% |
| p99 | 0.01ms | 0.04ms | -0.02ms | -65.46% |
| mean | 0.01ms | 0.01ms | -0.00ms | -42.87% |
| min | 0.00ms | 0.00ms | -0.00ms | -1.72% |
| max | 0.02ms | 0.43ms | -0.40ms | -94.72% |
| total | 1.05ms | 1.84ms | -0.79ms | -42.87% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.95% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -10.24% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +25.65% |
| mean | 0.00ms | 0.00ms | +0.00ms | +0.56% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.86% |
| max | 0.01ms | 0.01ms | -0.00ms | -12.15% |
| total | 0.12ms | 0.12ms | +0.00ms | +0.56% |

