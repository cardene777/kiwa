# Perf Suite — state-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.0032ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| subscribe_batch (5 listener + 5 state updates) | 0.0023ms | 0.0087ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatch_error_handling (5 unknown action type dispatch) | 0.0090ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | cpu | 0.08ms | 0.0032ms | 0.039 | 0.038 | 0.0032ms | 0.0032ms |
| subscribe_batch (5 listener + 5 state updates) | cpu | 0.08ms | 0.0023ms | 0.028 | 0.029 | 0.0023ms | 0.0024ms |
| dispatch_error_handling (5 unknown action type dispatch) | cpu | 0.08ms | 0.0090ms | 0.109 | 0.111 | 0.0092ms | 0.0094ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.02ms | 200ms | PASS |
| subscribe_batch (5 listener + 5 state updates) | 0.02ms | 200ms | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | -12384 B | 0 B | 102400 B | yes | PASS |
| subscribe_batch (5 listener + 5 state updates) | -232 B | 0 B | 102400 B | yes | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | -1368 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_provider_workflow (5 provider x 2 dispatch cycles)

# Perf Report — multi_provider_workflow (5 provider x 2 dispatch cycles).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0032ms |
| p50 | 0.0033ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0043ms |
| stdev | 0.0030ms |
| min | 0.0032ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0032ms | 0.0032ms | +0.000083ms | +2.63% |
| p50 | 0.0033ms | 0.0037ms | -0.00035ms | -9.61% |
| p95 | 0.01ms | 0.02ms | -0.0063ms | -35.59% |
| p99 | 0.01ms | 0.02ms | -0.0061ms | -30.67% |
| mean | 0.0043ms | 0.0054ms | -0.0011ms | -20.07% |
| min | 0.0032ms | 0.0030ms | +0.00017ms | +5.46% |
| max | 0.01ms | 0.02ms | -0.0061ms | -29.61% |
| total | 0.09ms | 0.11ms | -0.02ms | -20.07% |

### subscribe_batch (5 listener + 5 state updates)

# Perf Report — subscribe_batch (5 listener + 5 state updates).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0023ms |
| p50 | 0.0033ms |
| p95 | 0.0087ms |
| p99 | 0.01ms |
| mean | 0.0042ms |
| stdev | 0.0029ms |
| min | 0.0023ms |
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0024ms | -0.000037ms | -1.56% |
| p50 | 0.0033ms | 0.0026ms | +0.00071ms | +27.43% |
| p95 | 0.0087ms | 0.0089ms | -0.00024ms | -2.69% |
| p99 | 0.01ms | 0.02ms | -0.0096ms | -41.93% |
| mean | 0.0042ms | 0.0044ms | -0.00012ms | -2.78% |
| min | 0.0023ms | 0.0022ms | +0.000083ms | +3.69% |
| max | 0.01ms | 0.03ms | -0.01ms | -45.26% |
| total | 0.08ms | 0.09ms | -0.0024ms | -2.78% |

### dispatch_error_handling (5 unknown action type dispatch)

# Perf Report — dispatch_error_handling (5 unknown action type dispatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0090ms |
| p50 | 0.0091ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0095ms |
| stdev | 0.0012ms |
| min | 0.0088ms |
| max | 0.01ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0090ms | 0.0094ms | -0.00037ms | -3.96% |
| p50 | 0.0091ms | 0.01ms | -0.00090ms | -8.92% |
| p95 | 0.01ms | 0.08ms | -0.07ms | -86.44% |
| p99 | 0.01ms | 0.08ms | -0.07ms | -82.89% |
| mean | 0.0095ms | 0.02ms | -0.0099ms | -51.08% |
| min | 0.0088ms | 0.0093ms | -0.00050ms | -5.36% |
| max | 0.01ms | 0.08ms | -0.07ms | -82.04% |
| total | 0.19ms | 0.39ms | -0.20ms | -51.08% |

