# Perf Suite — state-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.0027ms | 0.01ms | 100ms | 0.00042ms | PASS | stable (p10 +2% (閾値未満)、 p95 +48% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| subscribe_batch (5 listener + 5 state updates) | 0.0026ms | 0.0097ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatch_error_handling (5 unknown action type dispatch) | 0.0084ms | 0.01ms | 100ms | 0.00042ms | PASS | stable (p10 -4% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.02ms | 200ms | PASS |
| subscribe_batch (5 listener + 5 state updates) | 0.02ms | 200ms | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | -227248 B | 0 B | 102400 B | yes | PASS |
| subscribe_batch (5 listener + 5 state updates) | 616 B | 0 B | 102400 B | yes | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | -1856 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_provider_workflow (5 provider x 2 dispatch cycles)

# Perf Report — multi_provider_workflow (5 provider x 2 dispatch cycles).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0027ms |
| p50 | 0.0047ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0049ms |
| stdev | 0.0025ms |
| min | 0.0026ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0026ms | +0.000042ms | +1.60% |
| p50 | 0.0047ms | 0.0046ms | +0.000083ms | +1.79% |
| p95 | 0.01ms | 0.0076ms | +0.0037ms | +48.35% |
| p99 | 0.01ms | 0.02ms | -0.0039ms | -25.51% |
| mean | 0.0049ms | 0.0049ms | -0.0000021ms | -0.04% |
| min | 0.0026ms | 0.0026ms | +0.000042ms | +1.63% |
| max | 0.01ms | 0.02ms | -0.0058ms | -33.65% |
| total | 0.10ms | 0.10ms | -0.000042ms | -0.04% |

### subscribe_batch (5 listener + 5 state updates)

# Perf Report — subscribe_batch (5 listener + 5 state updates).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0026ms |
| p50 | 0.0027ms |
| p95 | 0.0097ms |
| p99 | 0.01ms |
| mean | 0.0038ms |
| stdev | 0.0025ms |
| min | 0.0026ms |
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0023ms | +0.00030ms | +12.72% |
| p50 | 0.0027ms | 0.0029ms | -0.00021ms | -7.11% |
| p95 | 0.0097ms | 0.01ms | -0.0016ms | -13.95% |
| p99 | 0.01ms | 0.01ms | -0.0032ms | -21.84% |
| mean | 0.0038ms | 0.0043ms | -0.00050ms | -11.83% |
| min | 0.0026ms | 0.0022ms | +0.00037ms | +16.98% |
| max | 0.01ms | 0.02ms | -0.0036ms | -23.26% |
| total | 0.08ms | 0.09ms | -0.01ms | -11.83% |

### dispatch_error_handling (5 unknown action type dispatch)

# Perf Report — dispatch_error_handling (5 unknown action type dispatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0084ms |
| p50 | 0.0088ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0098ms |
| stdev | 0.0024ms |
| min | 0.0083ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0084ms | 0.0088ms | -0.00034ms | -3.89% |
| p50 | 0.0088ms | 0.0090ms | -0.00017ms | -1.86% |
| p95 | 0.01ms | 0.01ms | +0.0029ms | +24.94% |
| p99 | 0.02ms | 0.02ms | +0.0014ms | +9.07% |
| mean | 0.0098ms | 0.0096ms | +0.00028ms | +2.90% |
| min | 0.0083ms | 0.0087ms | -0.00037ms | -4.33% |
| max | 0.02ms | 0.02ms | +0.0010ms | +6.31% |
| total | 0.20ms | 0.19ms | +0.0055ms | +2.90% |

