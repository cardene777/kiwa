# Perf Suite — grpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeUnary | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +23392%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| invokeServerStream | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +10165%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeUnary | 0.01ms | 10ms | PASS |
| invokeServerStream | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeUnary | -856 B | -34471 B | 102400 B | yes | PASS |
| invokeServerStream | -22112 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeUnary

# Perf Report — invokeUnary.serial

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
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -11.07% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -13.17% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +17.25% |
| mean | 0.00ms | 0.00ms | -0.00ms | -8.16% |
| min | 0.00ms | 0.00ms | -0.00ms | -12.59% |
| max | 0.02ms | 0.02ms | -0.00ms | -15.85% |
| total | 0.20ms | 0.22ms | -0.02ms | -8.16% |

### invokeServerStream

# Perf Report — invokeServerStream.serial

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +19.96% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -59.67% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -25.37% |
| mean | 0.00ms | 0.00ms | -0.00ms | -19.70% |
| min | 0.00ms | 0.00ms | +0.00ms | +9.17% |
| max | 0.01ms | 0.03ms | -0.01ms | -47.51% |
| total | 0.31ms | 0.39ms | -0.08ms | -19.70% |

