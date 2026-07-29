# Perf Suite — state-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.0035ms | 0.0081ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| subscribe_batch (5 listener + 5 state updates) | 0.0027ms | 0.0096ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatch_error_handling (5 unknown action type dispatch) | 0.0085ms | 0.02ms | 100ms | 0.00050ms | PASS | stable (p10 -3% (閾値未満)、 p95 +37% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.02ms | 200ms | PASS |
| subscribe_batch (5 listener + 5 state updates) | 0.02ms | 200ms | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 5336 B | 0 B | 102400 B | yes | PASS |
| subscribe_batch (5 listener + 5 state updates) | -216 B | 0 B | 102400 B | yes | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | -2488 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_provider_workflow (5 provider x 2 dispatch cycles)

# Perf Report — multi_provider_workflow (5 provider x 2 dispatch cycles).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0035ms |
| p50 | 0.0054ms |
| p95 | 0.0081ms |
| p99 | 0.01ms |
| mean | 0.0056ms |
| stdev | 0.0028ms |
| min | 0.0026ms |
| max | 0.02ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0035ms | 0.0026ms | +0.00086ms | +32.90% |
| p50 | 0.0054ms | 0.0046ms | +0.00081ms | +17.57% |
| p95 | 0.0081ms | 0.0076ms | +0.00047ms | +6.24% |
| p99 | 0.01ms | 0.02ms | -0.00057ms | -3.74% |
| mean | 0.0056ms | 0.0049ms | +0.00070ms | +14.32% |
| min | 0.0026ms | 0.0026ms | +0.0000010ms | +0.04% |
| max | 0.02ms | 0.02ms | -0.00083ms | -4.84% |
| total | 0.11ms | 0.10ms | +0.01ms | +14.32% |

### subscribe_batch (5 listener + 5 state updates)

# Perf Report — subscribe_batch (5 listener + 5 state updates).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0027ms |
| p50 | 0.0036ms |
| p95 | 0.0096ms |
| p99 | 0.01ms |
| mean | 0.0044ms |
| stdev | 0.0030ms |
| min | 0.0027ms |
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0023ms | +0.00042ms | +17.91% |
| p50 | 0.0036ms | 0.0029ms | +0.00067ms | +22.87% |
| p95 | 0.0096ms | 0.01ms | -0.0016ms | -14.34% |
| p99 | 0.01ms | 0.01ms | -0.00075ms | -5.13% |
| mean | 0.0044ms | 0.0043ms | +0.00018ms | +4.11% |
| min | 0.0027ms | 0.0022ms | +0.00050ms | +22.64% |
| max | 0.02ms | 0.02ms | -0.00054ms | -3.47% |
| total | 0.09ms | 0.09ms | +0.0035ms | +4.11% |

### dispatch_error_handling (5 unknown action type dispatch)

# Perf Report — dispatch_error_handling (5 unknown action type dispatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0085ms |
| p50 | 0.0087ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0099ms |
| stdev | 0.0027ms |
| min | 0.0084ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0085ms | 0.0088ms | -0.00029ms | -3.27% |
| p50 | 0.0087ms | 0.0090ms | -0.00023ms | -2.56% |
| p95 | 0.02ms | 0.01ms | +0.0042ms | +36.64% |
| p99 | 0.02ms | 0.02ms | +0.0022ms | +14.46% |
| mean | 0.0099ms | 0.0096ms | +0.00039ms | +4.03% |
| min | 0.0084ms | 0.0087ms | -0.00025ms | -2.88% |
| max | 0.02ms | 0.02ms | +0.0017ms | +10.61% |
| total | 0.20ms | 0.19ms | +0.0077ms | +4.03% |

