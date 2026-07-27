# Perf Suite — edge

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeEdgeHandler | 0.02ms | 5ms | PASS | stable |
| invokeEdgeHandlerWithKv | 0.01ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEdgeHandler | 0.12ms | 10ms | PASS |
| invokeEdgeHandlerWithKv | 0.07ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeEdgeHandler | -2040 B | 400 B | 102400 B | yes | PASS |
| invokeEdgeHandlerWithKv | -520 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeEdgeHandler

# Perf Report — invokeEdgeHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.09ms |
| total | 2.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -1.72% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +6.35% |
| p99 | 0.05ms | 0.06ms | -0.01ms | -9.71% |
| mean | 0.01ms | 0.01ms | -0.00ms | -2.50% |
| min | 0.01ms | 0.01ms | -0.00ms | -3.77% |
| max | 0.09ms | 0.10ms | -0.00ms | -3.46% |
| total | 2.48ms | 2.55ms | -0.06ms | -2.50% |

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
| max | 0.01ms |
| total | 1.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -0.01% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -0.87% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -8.85% |
| mean | 0.01ms | 0.01ms | -0.00ms | -0.82% |
| min | 0.01ms | 0.01ms | +0.00ms | +3.92% |
| max | 0.01ms | 0.03ms | -0.02ms | -56.40% |
| total | 1.42ms | 1.43ms | -0.01ms | -0.82% |

