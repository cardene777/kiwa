# Perf Suite — state-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.0035ms | 0.01ms | 100ms | 0.00050ms | PASS | stable (p10 +34% (閾値未満)、 p95 +72% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| subscribe_batch (5 listener + 5 state updates) | 0.0027ms | 0.0079ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatch_error_handling (5 unknown action type dispatch) | 0.0085ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.02ms | 200ms | PASS |
| subscribe_batch (5 listener + 5 state updates) | 0.02ms | 200ms | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 7272 B | 0 B | 102400 B | yes | PASS |
| subscribe_batch (5 listener + 5 state updates) | 616 B | 0 B | 102400 B | yes | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | -1000 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_provider_workflow (5 provider x 2 dispatch cycles)

# Perf Report — multi_provider_workflow (5 provider x 2 dispatch cycles).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0035ms |
| p50 | 0.0051ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0066ms |
| stdev | 0.0036ms |
| min | 0.0026ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0035ms | 0.0026ms | +0.00089ms | +34.03% |
| p50 | 0.0051ms | 0.0046ms | +0.00050ms | +10.81% |
| p95 | 0.01ms | 0.0076ms | +0.0055ms | +72.25% |
| p99 | 0.01ms | 0.02ms | -0.00047ms | -3.07% |
| mean | 0.0066ms | 0.0049ms | +0.0016ms | +33.35% |
| min | 0.0026ms | 0.0026ms | +0.0000010ms | +0.04% |
| max | 0.02ms | 0.02ms | -0.0020ms | -11.38% |
| total | 0.13ms | 0.10ms | +0.03ms | +33.35% |

### subscribe_batch (5 listener + 5 state updates)

# Perf Report — subscribe_batch (5 listener + 5 state updates).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0027ms |
| p50 | 0.0035ms |
| p95 | 0.0079ms |
| p99 | 0.0097ms |
| mean | 0.0041ms |
| stdev | 0.0019ms |
| min | 0.0026ms |
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0023ms | +0.00037ms | +16.10% |
| p50 | 0.0035ms | 0.0029ms | +0.00060ms | +20.73% |
| p95 | 0.0079ms | 0.01ms | -0.0034ms | -29.91% |
| p99 | 0.0097ms | 0.01ms | -0.0050ms | -34.02% |
| mean | 0.0041ms | 0.0043ms | -0.00012ms | -2.83% |
| min | 0.0026ms | 0.0022ms | +0.00042ms | +18.89% |
| max | 0.01ms | 0.02ms | -0.0054ms | -34.76% |
| total | 0.08ms | 0.09ms | -0.0024ms | -2.83% |

### dispatch_error_handling (5 unknown action type dispatch)

# Perf Report — dispatch_error_handling (5 unknown action type dispatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0085ms |
| p50 | 0.0087ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0093ms |
| stdev | 0.0014ms |
| min | 0.0084ms |
| max | 0.01ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0085ms | 0.0088ms | -0.00029ms | -3.27% |
| p50 | 0.0087ms | 0.0090ms | -0.00025ms | -2.79% |
| p95 | 0.01ms | 0.01ms | -0.00019ms | -1.69% |
| p99 | 0.01ms | 0.02ms | -0.0019ms | -12.08% |
| mean | 0.0093ms | 0.0096ms | -0.00027ms | -2.83% |
| min | 0.0084ms | 0.0087ms | -0.00029ms | -3.37% |
| max | 0.01ms | 0.02ms | -0.0023ms | -13.88% |
| total | 0.19ms | 0.19ms | -0.0054ms | -2.83% |

