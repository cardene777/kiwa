# Perf Suite — solidstart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00058ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.0035ms | 0.0053ms | 100ms | 0.00059ms | PASS | stable — gate 無効 (regressionGate=false) |
| api_route_batch (5 invokeApiRoute) | 0.05ms | 0.10ms | 100ms | 0.00060ms | PASS | stable — gate 無効 (regressionGate=false) |
| fn_error_handling (5 throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00063ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | cpu | 0.08ms | 0.0035ms | 0.043 | 0.044 | 0.0036ms | 0.0036ms |
| api_route_batch (5 invokeApiRoute) | cpu | 0.08ms | 0.05ms | 0.682 | 0.634 | 0.06ms | 0.05ms |
| fn_error_handling (5 throw + catch) | cpu | 0.08ms | 0.01ms | 0.150 | 0.149 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.02ms | 200ms | PASS |
| api_route_batch (5 invokeApiRoute) | 0.26ms | 200ms | PASS |
| fn_error_handling (5 throw + catch) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | -60056 B | 0 B | 102400 B | yes | PASS |
| api_route_batch (5 invokeApiRoute) | 11544 B | 0 B | 102400 B | yes | PASS |
| fn_error_handling (5 throw + catch) | 664 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### server_function_workflow (10 invokeServerFunction)

# Perf Report — server_function_workflow (10 invokeServerFunction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0035ms |
| p50 | 0.0037ms |
| p95 | 0.0053ms |
| p99 | 0.0063ms |
| mean | 0.0040ms |
| stdev | 0.00080ms |
| min | 0.0035ms |
| max | 0.0066ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0035ms | 0.0036ms | -0.00013ms | -3.45% |
| p50 | 0.0037ms | 0.0040ms | -0.00031ms | -7.85% |
| p95 | 0.0053ms | 0.0065ms | -0.0012ms | -18.39% |
| p99 | 0.0063ms | 0.0086ms | -0.0023ms | -26.70% |
| mean | 0.0040ms | 0.0045ms | -0.00042ms | -9.42% |
| min | 0.0035ms | 0.0035ms | -0.000083ms | -2.34% |
| max | 0.0066ms | 0.0092ms | -0.0026ms | -28.18% |
| total | 0.08ms | 0.09ms | -0.0084ms | -9.42% |

### api_route_batch (5 invokeApiRoute)

# Perf Report — api_route_batch (5 invokeApiRoute).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.10ms |
| p99 | 0.11ms |
| mean | 0.06ms |
| stdev | 0.02ms |
| min | 0.05ms |
| max | 0.11ms |
| total | 1.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | +0.0019ms | +3.56% |
| p50 | 0.06ms | 0.06ms | -0.0033ms | -5.29% |
| p95 | 0.10ms | 0.11ms | -0.01ms | -9.24% |
| p99 | 0.11ms | 0.13ms | -0.02ms | -16.81% |
| mean | 0.06ms | 0.07ms | -0.0096ms | -12.90% |
| min | 0.05ms | 0.05ms | -0.0028ms | -5.45% |
| max | 0.11ms | 0.13ms | -0.02ms | -18.45% |
| total | 1.30ms | 1.49ms | -0.19ms | -12.90% |

### fn_error_handling (5 throw + catch)

# Perf Report — fn_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0014ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00084ms | -6.53% |
| p50 | 0.01ms | 0.01ms | -0.00056ms | -4.26% |
| p95 | 0.02ms | 0.02ms | -0.0052ms | -25.51% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -59.48% |
| mean | 0.01ms | 0.02ms | -0.0027ms | -17.38% |
| min | 0.01ms | 0.01ms | -0.0014ms | -10.92% |
| max | 0.02ms | 0.05ms | -0.03ms | -63.20% |
| total | 0.26ms | 0.32ms | -0.05ms | -17.38% |

