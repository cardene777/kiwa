# Perf Suite — edge

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeEdgeHandler | 0.03ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +1055%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| invokeEdgeHandlerWithKv | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +6053%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEdgeHandler | 0.15ms | 10ms | PASS |
| invokeEdgeHandlerWithKv | 0.37ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeEdgeHandler | 53000 B | -8368 B | 102400 B | yes | PASS |
| invokeEdgeHandlerWithKv | -82288 B | -1304 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeEdgeHandler

# Perf Report — invokeEdgeHandler.serial

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
| total | 2.91ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -21.02% |
| p95 | 0.03ms | 0.05ms | -0.02ms | -46.76% |
| p99 | 0.07ms | 0.14ms | -0.06ms | -47.45% |
| mean | 0.01ms | 0.02ms | -0.01ms | -30.85% |
| min | 0.01ms | 0.01ms | -0.00ms | -3.92% |
| max | 0.11ms | 0.33ms | -0.22ms | -66.52% |
| total | 2.91ms | 4.20ms | -1.30ms | -30.85% |

### invokeEdgeHandlerWithKv

# Perf Report — invokeEdgeHandlerWithKv.serial

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
| total | 1.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -4.05% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -14.73% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +7.51% |
| mean | 0.01ms | 0.01ms | -0.00ms | -1.77% |
| min | 0.00ms | 0.00ms | -0.00ms | -1.00% |
| max | 0.02ms | 0.02ms | +0.01ms | +38.61% |
| total | 1.01ms | 1.03ms | -0.02ms | -1.77% |

