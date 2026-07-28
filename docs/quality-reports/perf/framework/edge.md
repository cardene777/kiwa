# Perf Suite — edge

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeEdgeHandler | 0.02ms | 5ms | PASS | stable (差 0.02ms が下限 0.5ms 未満で判定を保留) |
| invokeEdgeHandlerWithKv | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +6053%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEdgeHandler | 0.14ms | 10ms | PASS |
| invokeEdgeHandlerWithKv | 0.10ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeEdgeHandler | -31368 B | -4 B | 102400 B | yes | PASS |
| invokeEdgeHandlerWithKv | 2080 B | -1240 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeEdgeHandler

# Perf Report — invokeEdgeHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.10ms |
| total | 2.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -33.10% |
| p95 | 0.02ms | 0.05ms | -0.02ms | -49.37% |
| p99 | 0.06ms | 0.14ms | -0.08ms | -56.90% |
| mean | 0.01ms | 0.02ms | -0.01ms | -38.57% |
| min | 0.01ms | 0.01ms | -0.00ms | -8.82% |
| max | 0.10ms | 0.33ms | -0.23ms | -70.41% |
| total | 2.58ms | 4.20ms | -1.62ms | -38.57% |

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
| total | 1.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +55.85% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -3.07% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -18.00% |
| mean | 0.01ms | 0.01ms | +0.00ms | +42.82% |
| min | 0.01ms | 0.00ms | +0.00ms | +67.35% |
| max | 0.01ms | 0.02ms | -0.00ms | -18.22% |
| total | 1.47ms | 1.03ms | +0.44ms | +42.82% |

