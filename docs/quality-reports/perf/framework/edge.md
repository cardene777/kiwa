# Perf Suite — edge

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeEdgeHandler | 0.0091ms | 0.02ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeEdgeHandlerWithKv | 0.0084ms | 0.01ms | 5ms | 0.00033ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEdgeHandler | 0.18ms | 10ms | PASS |
| invokeEdgeHandlerWithKv | 0.14ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeEdgeHandler | 4848 B | -9408 B | 102400 B | yes | PASS |
| invokeEdgeHandlerWithKv | 152 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeEdgeHandler

# Perf Report — invokeEdgeHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0091ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.0096ms |
| min | 0.0080ms |
| max | 0.10ms |
| total | 2.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0091ms | 0.0082ms | +0.00087ms | +10.60% |
| p50 | 0.01ms | 0.0095ms | +0.0012ms | +12.55% |
| p95 | 0.02ms | 0.03ms | -0.0049ms | -17.96% |
| p99 | 0.06ms | 0.10ms | -0.04ms | -40.72% |
| mean | 0.01ms | 0.02ms | -0.0025ms | -15.75% |
| min | 0.0080ms | 0.0077ms | +0.00029ms | +3.75% |
| max | 0.10ms | 0.65ms | -0.56ms | -85.24% |
| total | 2.72ms | 3.23ms | -0.51ms | -15.75% |

### invokeEdgeHandlerWithKv

# Perf Report — invokeEdgeHandlerWithKv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0084ms |
| p50 | 0.0086ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0090ms |
| stdev | 0.0015ms |
| min | 0.0083ms |
| max | 0.02ms |
| total | 1.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0084ms | 0.0070ms | +0.0014ms | +20.23% |
| p50 | 0.0086ms | 0.0072ms | +0.0014ms | +19.65% |
| p95 | 0.01ms | 0.0095ms | +0.0025ms | +26.79% |
| p99 | 0.02ms | 0.01ms | +0.0055ms | +53.39% |
| mean | 0.0090ms | 0.0079ms | +0.0011ms | +13.91% |
| min | 0.0083ms | 0.0069ms | +0.0014ms | +20.00% |
| max | 0.02ms | 0.06ms | -0.04ms | -67.80% |
| total | 1.81ms | 1.59ms | +0.22ms | +13.91% |

