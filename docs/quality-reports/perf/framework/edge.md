# Perf Suite — edge

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeEdgeHandler | 0.03ms | 5ms | PASS | stable |
| invokeEdgeHandlerWithKv | 0.01ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEdgeHandler | 0.16ms | 10ms | PASS |
| invokeEdgeHandlerWithKv | 0.05ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| invokeEdgeHandler | 3093232 B | 400 B | 102400 B | PASS |
| invokeEdgeHandlerWithKv | -5891784 B | -2345 B | 102400 B | PASS |

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
| max | 0.11ms |
| total | 2.88ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -17.66% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -12.70% |
| p99 | 0.06ms | 0.07ms | -0.01ms | -18.39% |
| mean | 0.01ms | 0.02ms | -0.00ms | -22.70% |
| min | 0.01ms | 0.01ms | +0.00ms | +15.76% |
| max | 0.11ms | 0.83ms | -0.72ms | -86.30% |
| total | 2.88ms | 3.73ms | -0.85ms | -22.70% |

### invokeEdgeHandlerWithKv

# Perf Report — invokeEdgeHandlerWithKv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.35ms |
| mean | 0.02ms |
| stdev | 0.12ms |
| min | 0.00ms |
| max | 1.37ms |
| total | 4.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +23.87% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +52.70% |
| p99 | 0.35ms | 0.01ms | +0.34ms | +2410.12% |
| mean | 0.02ms | 0.01ms | +0.02ms | +278.50% |
| min | 0.00ms | 0.00ms | +0.00ms | +2.01% |
| max | 1.37ms | 0.03ms | +1.34ms | +4208.06% |
| total | 4.20ms | 1.11ms | +3.09ms | +278.50% |

