# Perf Suite — rust-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeAxumHandler | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +6345%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| invokeActixHandler | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +29044%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| captureTowerMiddleware | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +39670%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| invokeRocketRoute | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +35001%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeAxumHandler | 0.02ms | 10ms | PASS |
| invokeActixHandler | 0.01ms | 10ms | PASS |
| captureTowerMiddleware | 0.01ms | 10ms | PASS |
| invokeRocketRoute | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeAxumHandler | 4288 B | -60422 B | 102400 B | yes | PASS |
| invokeActixHandler | 3824 B | 0 B | 102400 B | yes | PASS |
| captureTowerMiddleware | 616 B | 0 B | 102400 B | yes | PASS |
| invokeRocketRoute | 4656 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeAxumHandler

# Perf Report — invokeAxumHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -4.17% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -30.12% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -44.48% |
| mean | 0.00ms | 0.00ms | -0.00ms | -19.64% |
| min | 0.00ms | 0.00ms | -0.00ms | -3.73% |
| max | 0.02ms | 0.04ms | -0.02ms | -56.47% |
| total | 0.37ms | 0.47ms | -0.09ms | -19.64% |

### invokeActixHandler

# Perf Report — invokeActixHandler.serial

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
| max | 0.00ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -0.24% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -51.43% |
| mean | 0.00ms | 0.00ms | -0.00ms | -18.87% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.02ms | -0.01ms | -73.67% |
| total | 0.13ms | 0.16ms | -0.03ms | -18.87% |

### captureTowerMiddleware

# Perf Report — captureTowerMiddleware.serial

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
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -10.49% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +82.27% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +78.52% |
| mean | 0.00ms | 0.00ms | +0.00ms | +4.54% |
| min | 0.00ms | 0.00ms | -0.00ms | -11.72% |
| max | 0.01ms | 0.01ms | +0.00ms | +43.06% |
| total | 0.20ms | 0.19ms | +0.01ms | +4.54% |

### invokeRocketRoute

# Perf Report — invokeRocketRoute.serial

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
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +122.22% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +186.03% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +125.25% |
| mean | 0.00ms | 0.00ms | +0.00ms | +109.87% |
| min | 0.00ms | 0.00ms | +0.00ms | +8.40% |
| max | 0.02ms | 0.01ms | +0.01ms | +178.01% |
| total | 0.29ms | 0.14ms | +0.15ms | +109.87% |

