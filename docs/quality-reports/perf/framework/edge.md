# Perf Suite — edge

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeEdgeHandler | 0.0093ms | 0.02ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeEdgeHandlerWithKv | 0.0077ms | 0.0086ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEdgeHandler | 0.13ms | 10ms | PASS |
| invokeEdgeHandlerWithKv | 0.08ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeEdgeHandler | 22816 B | -4 B | 102400 B | yes | PASS |
| invokeEdgeHandlerWithKv | 1984 B | -5 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeEdgeHandler

# Perf Report — invokeEdgeHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0093ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0082ms |
| max | 0.10ms |
| total | 2.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0093ms | 0.0082ms | +0.0011ms | +13.08% |
| p50 | 0.01ms | 0.0095ms | +0.00085ms | +9.02% |
| p95 | 0.02ms | 0.03ms | -0.0026ms | -9.50% |
| p99 | 0.06ms | 0.10ms | -0.03ms | -33.14% |
| mean | 0.01ms | 0.02ms | -0.0026ms | -16.00% |
| min | 0.0082ms | 0.0077ms | +0.00042ms | +5.38% |
| max | 0.10ms | 0.65ms | -0.55ms | -84.26% |
| total | 2.71ms | 3.23ms | -0.52ms | -16.00% |

### invokeEdgeHandlerWithKv

# Perf Report — invokeEdgeHandlerWithKv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0077ms |
| p50 | 0.0079ms |
| p95 | 0.0086ms |
| p99 | 0.01ms |
| mean | 0.0081ms |
| stdev | 0.0014ms |
| min | 0.0075ms |
| max | 0.02ms |
| total | 1.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0077ms | 0.0070ms | +0.00070ms | +10.06% |
| p50 | 0.0079ms | 0.0072ms | +0.00067ms | +9.25% |
| p95 | 0.0086ms | 0.0095ms | -0.00092ms | -9.69% |
| p99 | 0.01ms | 0.01ms | +0.0019ms | +18.60% |
| mean | 0.0081ms | 0.0079ms | +0.00017ms | +2.12% |
| min | 0.0075ms | 0.0069ms | +0.00062ms | +9.09% |
| max | 0.02ms | 0.06ms | -0.04ms | -61.50% |
| total | 1.62ms | 1.59ms | +0.03ms | +2.12% |

