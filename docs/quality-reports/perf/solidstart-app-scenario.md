# Perf Suite — solidstart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.0045ms | 0.0052ms | 100ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |
| api_route_batch (5 invokeApiRoute) | 0.06ms | 0.12ms | 100ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |
| fn_error_handling (5 throw + catch) | 0.02ms | 0.02ms | 100ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.03ms | 200ms | PASS |
| api_route_batch (5 invokeApiRoute) | 0.29ms | 200ms | PASS |
| fn_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 10240 B | 0 B | 102400 B | yes | PASS |
| api_route_batch (5 invokeApiRoute) | 13368 B | 0 B | 102400 B | yes | PASS |
| fn_error_handling (5 throw + catch) | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### server_function_workflow (10 invokeServerFunction)

# Perf Report — server_function_workflow (10 invokeServerFunction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0045ms |
| p50 | 0.0045ms |
| p95 | 0.0052ms |
| p99 | 0.0073ms |
| mean | 0.0047ms |
| stdev | 0.00076ms |
| min | 0.0044ms |
| max | 0.0079ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0044ms | +0.000083ms | +1.90% |
| p50 | 0.0045ms | 0.0045ms | -0.000041ms | -0.92% |
| p95 | 0.0052ms | 0.0056ms | -0.00037ms | -6.66% |
| p99 | 0.0073ms | 0.0057ms | +0.0016ms | +28.48% |
| mean | 0.0047ms | 0.0047ms | +0.000058ms | +1.25% |
| min | 0.0044ms | 0.0044ms | +0.000041ms | +0.94% |
| max | 0.0079ms | 0.0057ms | +0.0021ms | +36.96% |
| total | 0.09ms | 0.09ms | +0.0012ms | +1.25% |

### api_route_batch (5 invokeApiRoute)

# Perf Report — api_route_batch (5 invokeApiRoute).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.06ms |
| p50 | 0.08ms |
| p95 | 0.12ms |
| p99 | 0.12ms |
| mean | 0.08ms |
| stdev | 0.02ms |
| min | 0.06ms |
| max | 0.12ms |
| total | 1.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.05ms | +0.010ms | +18.52% |
| p50 | 0.08ms | 0.08ms | +0.00023ms | +0.30% |
| p95 | 0.12ms | 0.27ms | -0.15ms | -54.86% |
| p99 | 0.12ms | 0.99ms | -0.86ms | -87.70% |
| mean | 0.08ms | 0.13ms | -0.05ms | -39.18% |
| min | 0.06ms | 0.05ms | +0.01ms | +20.67% |
| max | 0.12ms | 1.17ms | -1.04ms | -89.58% |
| total | 1.63ms | 2.68ms | -1.05ms | -39.18% |

### fn_error_handling (5 throw + catch)

# Perf Report — fn_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0022ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00045ms | -2.60% |
| p50 | 0.02ms | 0.02ms | -0.00035ms | -1.90% |
| p95 | 0.02ms | 0.02ms | -0.0028ms | -11.50% |
| p99 | 0.03ms | 0.03ms | +0.00057ms | +2.27% |
| mean | 0.02ms | 0.02ms | -0.00047ms | -2.42% |
| min | 0.02ms | 0.02ms | -0.00046ms | -2.62% |
| max | 0.03ms | 0.03ms | +0.0014ms | +5.61% |
| total | 0.38ms | 0.39ms | -0.0094ms | -2.42% |

