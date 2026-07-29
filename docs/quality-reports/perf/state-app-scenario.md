# Perf Suite — state-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.0026ms | 0.0077ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| subscribe_batch (5 listener + 5 state updates) | 0.0027ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatch_error_handling (5 unknown action type dispatch) | 0.0088ms | 0.01ms | 100ms | 0.00050ms | PASS | stable (p10 -0% (閾値未満)、 p95 +28% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.02ms | 200ms | PASS |
| subscribe_batch (5 listener + 5 state updates) | 0.02ms | 200ms | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 6128 B | 0 B | 102400 B | yes | PASS |
| subscribe_batch (5 listener + 5 state updates) | 616 B | 0 B | 102400 B | yes | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | -1480 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_provider_workflow (5 provider x 2 dispatch cycles)

# Perf Report — multi_provider_workflow (5 provider x 2 dispatch cycles).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0026ms |
| p50 | 0.0046ms |
| p95 | 0.0077ms |
| p99 | 0.02ms |
| mean | 0.0051ms |
| stdev | 0.0034ms |
| min | 0.0026ms |
| max | 0.02ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0026ms | +0.0000041ms | +0.16% |
| p50 | 0.0046ms | 0.0046ms | 0.00ms | 0.00% |
| p95 | 0.0077ms | 0.0076ms | +0.000069ms | +0.91% |
| p99 | 0.02ms | 0.02ms | +0.0011ms | +7.29% |
| mean | 0.0051ms | 0.0049ms | +0.00014ms | +2.80% |
| min | 0.0026ms | 0.0026ms | +0.0000010ms | +0.04% |
| max | 0.02ms | 0.02ms | +0.0014ms | +7.99% |
| total | 0.10ms | 0.10ms | +0.0028ms | +2.80% |

### subscribe_batch (5 listener + 5 state updates)

# Perf Report — subscribe_batch (5 listener + 5 state updates).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0027ms |
| p50 | 0.0028ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0044ms |
| stdev | 0.0032ms |
| min | 0.0027ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0023ms | +0.00042ms | +17.91% |
| p50 | 0.0028ms | 0.0029ms | -0.000083ms | -2.85% |
| p95 | 0.01ms | 0.01ms | +0.0014ms | +12.67% |
| p99 | 0.01ms | 0.01ms | -0.0016ms | -11.20% |
| mean | 0.0044ms | 0.0043ms | +0.00010ms | +2.40% |
| min | 0.0027ms | 0.0022ms | +0.00046ms | +20.79% |
| max | 0.01ms | 0.02ms | -0.0024ms | -15.50% |
| total | 0.09ms | 0.09ms | +0.0020ms | +2.40% |

### dispatch_error_handling (5 unknown action type dispatch)

# Perf Report — dispatch_error_handling (5 unknown action type dispatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0088ms |
| p50 | 0.0089ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0098ms |
| stdev | 0.0021ms |
| min | 0.0086ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0088ms | 0.0088ms | -0.0000041ms | -0.05% |
| p50 | 0.0089ms | 0.0090ms | -0.000063ms | -0.70% |
| p95 | 0.01ms | 0.01ms | +0.0032ms | +27.90% |
| p99 | 0.02ms | 0.02ms | +0.00057ms | +3.70% |
| mean | 0.0098ms | 0.0096ms | +0.00026ms | +2.68% |
| min | 0.0086ms | 0.0087ms | -0.000042ms | -0.48% |
| max | 0.02ms | 0.02ms | -0.000083ms | -0.50% |
| total | 0.20ms | 0.19ms | +0.0051ms | +2.68% |

