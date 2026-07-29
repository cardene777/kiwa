# Perf Suite — solidstart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.0032ms | 0.0069ms | 100ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| api_route_batch (5 invokeApiRoute) | 0.05ms | 0.10ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| fn_error_handling (5 throw + catch) | 0.02ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.03ms | 200ms | PASS |
| api_route_batch (5 invokeApiRoute) | 0.26ms | 200ms | PASS |
| fn_error_handling (5 throw + catch) | 0.08ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 4200 B | 0 B | 102400 B | yes | PASS |
| api_route_batch (5 invokeApiRoute) | 14016 B | -3060 B | 102400 B | yes | PASS |
| fn_error_handling (5 throw + catch) | -2976 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### server_function_workflow (10 invokeServerFunction)

# Perf Report — server_function_workflow (10 invokeServerFunction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0032ms |
| p50 | 0.0042ms |
| p95 | 0.0069ms |
| p99 | 0.0071ms |
| mean | 0.0043ms |
| stdev | 0.0012ms |
| min | 0.0032ms |
| max | 0.0072ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0032ms | 0.0044ms | -0.0011ms | -25.71% |
| p50 | 0.0042ms | 0.0045ms | -0.00035ms | -7.83% |
| p95 | 0.0069ms | 0.0056ms | +0.0014ms | +24.80% |
| p99 | 0.0071ms | 0.0057ms | +0.0014ms | +24.67% |
| mean | 0.0043ms | 0.0047ms | -0.00031ms | -6.76% |
| min | 0.0032ms | 0.0044ms | -0.0011ms | -25.71% |
| max | 0.0072ms | 0.0057ms | +0.0014ms | +24.64% |
| total | 0.09ms | 0.09ms | -0.0063ms | -6.76% |

### api_route_batch (5 invokeApiRoute)

# Perf Report — api_route_batch (5 invokeApiRoute).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.10ms |
| p99 | 0.24ms |
| mean | 0.07ms |
| stdev | 0.05ms |
| min | 0.05ms |
| max | 0.27ms |
| total | 1.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.00042ms | -0.77% |
| p50 | 0.06ms | 0.08ms | -0.01ms | -17.47% |
| p95 | 0.10ms | 0.27ms | -0.17ms | -63.03% |
| p99 | 0.24ms | 0.99ms | -0.75ms | -76.07% |
| mean | 0.07ms | 0.13ms | -0.06ms | -44.37% |
| min | 0.05ms | 0.05ms | -0.0040ms | -7.63% |
| max | 0.27ms | 1.17ms | -0.89ms | -76.81% |
| total | 1.49ms | 2.68ms | -1.19ms | -44.37% |

### fn_error_handling (5 throw + catch)

# Perf Report — fn_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0017ms |
| min | 0.02ms |
| max | 0.02ms |
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00041ms | -2.35% |
| p50 | 0.02ms | 0.02ms | -0.00081ms | -4.36% |
| p95 | 0.02ms | 0.02ms | -0.0035ms | -14.41% |
| p99 | 0.02ms | 0.03ms | -0.0015ms | -5.87% |
| mean | 0.02ms | 0.02ms | -0.0011ms | -5.51% |
| min | 0.02ms | 0.02ms | -0.00062ms | -3.57% |
| max | 0.02ms | 0.03ms | -0.00096ms | -3.79% |
| total | 0.37ms | 0.39ms | -0.02ms | -5.51% |

