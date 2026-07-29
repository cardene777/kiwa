# Perf Suite — edge

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeEdgeHandler | 0.0088ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeEdgeHandlerWithKv | 0.0067ms | 0.0078ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEdgeHandler | 0.15ms | 10ms | PASS |
| invokeEdgeHandlerWithKv | 0.08ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeEdgeHandler | -91848 B | 0 B | 102400 B | yes | PASS |
| invokeEdgeHandlerWithKv | -688 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeEdgeHandler

# Perf Report — invokeEdgeHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0088ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0077ms |
| max | 0.09ms |
| total | 2.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0088ms | 0.0082ms | +0.00057ms | +6.94% |
| p50 | 0.01ms | 0.0095ms | +0.0010ms | +11.01% |
| p95 | 0.03ms | 0.03ms | -0.0019ms | -6.85% |
| p99 | 0.06ms | 0.10ms | -0.04ms | -38.97% |
| mean | 0.01ms | 0.02ms | -0.0028ms | -17.47% |
| min | 0.0077ms | 0.0077ms | -0.000084ms | -1.08% |
| max | 0.09ms | 0.65ms | -0.56ms | -85.54% |
| total | 2.67ms | 3.23ms | -0.56ms | -17.47% |

### invokeEdgeHandlerWithKv

# Perf Report — invokeEdgeHandlerWithKv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0067ms |
| p50 | 0.0068ms |
| p95 | 0.0078ms |
| p99 | 0.01ms |
| mean | 0.0070ms |
| stdev | 0.00068ms |
| min | 0.0065ms |
| max | 0.01ms |
| total | 1.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0067ms | 0.0070ms | -0.00033ms | -4.76% |
| p50 | 0.0068ms | 0.0072ms | -0.00037ms | -5.20% |
| p95 | 0.0078ms | 0.0095ms | -0.0018ms | -18.43% |
| p99 | 0.01ms | 0.01ms | -0.000062ms | -0.60% |
| mean | 0.0070ms | 0.0079ms | -0.00094ms | -11.82% |
| min | 0.0065ms | 0.0069ms | -0.00038ms | -5.45% |
| max | 0.01ms | 0.06ms | -0.05ms | -80.29% |
| total | 1.40ms | 1.59ms | -0.19ms | -11.82% |

