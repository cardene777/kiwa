# Perf Suite — state-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.0029ms | 0.0071ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| subscribe_batch (5 listener + 5 state updates) | 0.0027ms | 0.0084ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatch_error_handling (5 unknown action type dispatch) | 0.0086ms | 0.01ms | 100ms | 0.00049ms | PASS | stable (p10 -2% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.02ms | 200ms | PASS |
| subscribe_batch (5 listener + 5 state updates) | 0.02ms | 200ms | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 5968 B | 0 B | 102400 B | yes | PASS |
| subscribe_batch (5 listener + 5 state updates) | -104 B | 0 B | 102400 B | yes | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | 259976 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_provider_workflow (5 provider x 2 dispatch cycles)

# Perf Report — multi_provider_workflow (5 provider x 2 dispatch cycles).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0029ms |
| p50 | 0.0045ms |
| p95 | 0.0071ms |
| p99 | 0.0073ms |
| mean | 0.0046ms |
| stdev | 0.0015ms |
| min | 0.0025ms |
| max | 0.0074ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0026ms | +0.00025ms | +9.67% |
| p50 | 0.0045ms | 0.0046ms | -0.000083ms | -1.81% |
| p95 | 0.0071ms | 0.0076ms | -0.00053ms | -6.96% |
| p99 | 0.0073ms | 0.02ms | -0.0079ms | -51.94% |
| mean | 0.0046ms | 0.0049ms | -0.00033ms | -6.65% |
| min | 0.0025ms | 0.0026ms | -0.000083ms | -3.21% |
| max | 0.0074ms | 0.02ms | -0.0098ms | -56.90% |
| total | 0.09ms | 0.10ms | -0.0065ms | -6.65% |

### subscribe_batch (5 listener + 5 state updates)

# Perf Report — subscribe_batch (5 listener + 5 state updates).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0027ms |
| p50 | 0.0033ms |
| p95 | 0.0084ms |
| p99 | 0.01ms |
| mean | 0.0043ms |
| stdev | 0.0024ms |
| min | 0.0026ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0023ms | +0.00038ms | +16.11% |
| p50 | 0.0033ms | 0.0029ms | +0.00038ms | +12.86% |
| p95 | 0.0084ms | 0.01ms | -0.0029ms | -25.58% |
| p99 | 0.01ms | 0.01ms | -0.0035ms | -23.62% |
| mean | 0.0043ms | 0.0043ms | +0.000081ms | +1.91% |
| min | 0.0026ms | 0.0022ms | +0.00037ms | +16.98% |
| max | 0.01ms | 0.02ms | -0.0036ms | -23.26% |
| total | 0.09ms | 0.09ms | +0.0016ms | +1.91% |

### dispatch_error_handling (5 unknown action type dispatch)

# Perf Report — dispatch_error_handling (5 unknown action type dispatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0086ms |
| p50 | 0.0089ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0099ms |
| stdev | 0.0023ms |
| min | 0.0086ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0086ms | 0.0088ms | -0.00016ms | -1.80% |
| p50 | 0.0089ms | 0.0090ms | -0.000062ms | -0.69% |
| p95 | 0.01ms | 0.01ms | +0.0024ms | +20.84% |
| p99 | 0.02ms | 0.02ms | +0.0014ms | +8.90% |
| mean | 0.0099ms | 0.0096ms | +0.00036ms | +3.73% |
| min | 0.0086ms | 0.0087ms | -0.000084ms | -0.97% |
| max | 0.02ms | 0.02ms | +0.0011ms | +6.82% |
| total | 0.20ms | 0.19ms | +0.0071ms | +3.73% |

