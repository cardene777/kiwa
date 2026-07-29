# Perf Suite — nextjs

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeServerAction | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +11856%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| invokeMiddleware | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +4424%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| renderServerComponent | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +59510%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerAction | 0.02ms | 10ms | PASS |
| invokeMiddleware | 0.08ms | 10ms | PASS |
| renderServerComponent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerAction | -7432 B | 0 B | 102400 B | yes | PASS |
| invokeMiddleware | -12704 B | 0 B | 102400 B | yes | PASS |
| renderServerComponent | -16056 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +37.48% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -52.08% |
| p99 | 0.01ms | 0.06ms | -0.05ms | -80.26% |
| mean | 0.00ms | 0.00ms | -0.00ms | -65.70% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.41ms | -0.38ms | -93.98% |
| total | 0.27ms | 0.80ms | -0.53ms | -65.70% |

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
| min | 0.00ms |
| max | 0.02ms |
| total | 1.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -1.58% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -28.39% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -57.43% |
| mean | 0.01ms | 0.01ms | -0.00ms | -38.36% |
| min | 0.00ms | 0.00ms | +0.00ms | +0.87% |
| max | 0.02ms | 0.43ms | -0.40ms | -94.77% |
| total | 1.14ms | 1.84ms | -0.71ms | -38.36% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -19.98% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +19.33% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.80% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -18.57% |
| total | 0.12ms | 0.12ms | -0.00ms | -0.80% |

