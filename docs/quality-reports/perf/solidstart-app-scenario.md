# Perf Suite — solidstart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.0033ms | 0.0067ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| api_route_batch (5 invokeApiRoute) | 0.05ms | 0.10ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| fn_error_handling (5 throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.02ms | 200ms | PASS |
| api_route_batch (5 invokeApiRoute) | 0.25ms | 200ms | PASS |
| fn_error_handling (5 throw + catch) | 0.22ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | -4408 B | 0 B | 102400 B | yes | PASS |
| api_route_batch (5 invokeApiRoute) | -3832 B | 0 B | 102400 B | yes | PASS |
| fn_error_handling (5 throw + catch) | 632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### server_function_workflow (10 invokeServerFunction)

# Perf Report — server_function_workflow (10 invokeServerFunction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0033ms |
| p50 | 0.0038ms |
| p95 | 0.0067ms |
| p99 | 0.0084ms |
| mean | 0.0046ms |
| stdev | 0.0016ms |
| min | 0.0033ms |
| max | 0.0088ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0033ms | 0.0044ms | -0.0010ms | -23.80% |
| p50 | 0.0038ms | 0.0045ms | -0.00073ms | -16.14% |
| p95 | 0.0067ms | 0.0056ms | +0.0012ms | +21.31% |
| p99 | 0.0084ms | 0.0057ms | +0.0027ms | +47.33% |
| mean | 0.0046ms | 0.0047ms | -0.000098ms | -2.11% |
| min | 0.0033ms | 0.0044ms | -0.0011ms | -24.75% |
| max | 0.0088ms | 0.0057ms | +0.0031ms | +53.62% |
| total | 0.09ms | 0.09ms | -0.0020ms | -2.11% |

### api_route_batch (5 invokeApiRoute)

# Perf Report — api_route_batch (5 invokeApiRoute).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.10ms |
| p99 | 0.10ms |
| mean | 0.07ms |
| stdev | 0.02ms |
| min | 0.05ms |
| max | 0.10ms |
| total | 1.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.000071ms | -0.13% |
| p50 | 0.06ms | 0.08ms | -0.01ms | -15.46% |
| p95 | 0.10ms | 0.27ms | -0.17ms | -63.40% |
| p99 | 0.10ms | 0.99ms | -0.89ms | -89.86% |
| mean | 0.07ms | 0.13ms | -0.07ms | -49.21% |
| min | 0.05ms | 0.05ms | +0.00029ms | +0.56% |
| max | 0.10ms | 1.17ms | -1.06ms | -91.37% |
| total | 1.36ms | 2.68ms | -1.32ms | -49.21% |

### fn_error_handling (5 throw + catch)

# Perf Report — fn_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0046ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0062ms | -35.46% |
| p50 | 0.02ms | 0.02ms | -0.0014ms | -7.72% |
| p95 | 0.02ms | 0.02ms | -0.0047ms | -19.02% |
| p99 | 0.03ms | 0.03ms | +0.0031ms | +12.22% |
| mean | 0.02ms | 0.02ms | -0.0034ms | -17.82% |
| min | 0.01ms | 0.02ms | -0.0062ms | -35.79% |
| max | 0.03ms | 0.03ms | +0.0050ms | +19.80% |
| total | 0.32ms | 0.39ms | -0.07ms | -17.82% |

