# Perf Suite — edge

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeEdgeHandler | 0.03ms | 5ms | PASS | stable |
| invokeEdgeHandlerWithKv | 0.01ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEdgeHandler | 0.27ms | 10ms | PASS |
| invokeEdgeHandlerWithKv | 0.14ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeEdgeHandler | 16936 B | -4 B | 102400 B | yes | PASS |
| invokeEdgeHandlerWithKv | 1400 B | 350 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeEdgeHandler

# Perf Report — invokeEdgeHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.10ms |
| total | 2.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +5.59% |
| p95 | 0.03ms | 0.02ms | +0.00ms | +13.03% |
| p99 | 0.06ms | 0.06ms | +0.00ms | +4.16% |
| mean | 0.01ms | 0.01ms | +0.00ms | +6.18% |
| min | 0.01ms | 0.01ms | +0.00ms | +0.54% |
| max | 0.10ms | 0.10ms | +0.00ms | +0.38% |
| total | 2.70ms | 2.55ms | +0.16ms | +6.18% |

### invokeEdgeHandlerWithKv

# Perf Report — invokeEdgeHandlerWithKv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 1.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -1.21% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -2.13% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +6.17% |
| mean | 0.01ms | 0.01ms | -0.00ms | -1.21% |
| min | 0.01ms | 0.01ms | +0.00ms | +0.66% |
| max | 0.02ms | 0.03ms | -0.01ms | -37.83% |
| total | 1.41ms | 1.43ms | -0.02ms | -1.21% |

