# Perf Suite — solidstart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.0032ms | 0.0062ms | 100ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| api_route_batch (5 invokeApiRoute) | 0.05ms | 0.09ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| fn_error_handling (5 throw + catch) | 0.01ms | 0.03ms | 100ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.02ms | 200ms | PASS |
| api_route_batch (5 invokeApiRoute) | 0.25ms | 200ms | PASS |
| fn_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | -261528 B | 0 B | 102400 B | yes | PASS |
| api_route_batch (5 invokeApiRoute) | -7296 B | 0 B | 102400 B | yes | PASS |
| fn_error_handling (5 throw + catch) | -376 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### server_function_workflow (10 invokeServerFunction)

# Perf Report — server_function_workflow (10 invokeServerFunction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0032ms |
| p50 | 0.0041ms |
| p95 | 0.0062ms |
| p99 | 0.0085ms |
| mean | 0.0043ms |
| stdev | 0.0014ms |
| min | 0.0032ms |
| max | 0.0091ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0032ms | 0.0044ms | -0.0011ms | -25.71% |
| p50 | 0.0041ms | 0.0045ms | -0.00040ms | -8.76% |
| p95 | 0.0062ms | 0.0056ms | +0.00068ms | +12.28% |
| p99 | 0.0085ms | 0.0057ms | +0.0028ms | +49.09% |
| mean | 0.0043ms | 0.0047ms | -0.00040ms | -8.56% |
| min | 0.0032ms | 0.0044ms | -0.0011ms | -25.71% |
| max | 0.0091ms | 0.0057ms | +0.0033ms | +57.98% |
| total | 0.09ms | 0.09ms | -0.0080ms | -8.56% |

### api_route_batch (5 invokeApiRoute)

# Perf Report — api_route_batch (5 invokeApiRoute).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.07ms |
| p95 | 0.09ms |
| p99 | 0.10ms |
| mean | 0.07ms |
| stdev | 0.01ms |
| min | 0.05ms |
| max | 0.10ms |
| total | 1.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.00098ms | -1.82% |
| p50 | 0.07ms | 0.08ms | -0.0077ms | -10.22% |
| p95 | 0.09ms | 0.27ms | -0.17ms | -64.88% |
| p99 | 0.10ms | 0.99ms | -0.89ms | -89.91% |
| mean | 0.07ms | 0.13ms | -0.07ms | -48.95% |
| min | 0.05ms | 0.05ms | -0.00092ms | -1.75% |
| max | 0.10ms | 1.17ms | -1.06ms | -91.34% |
| total | 1.37ms | 2.68ms | -1.31ms | -48.95% |

### fn_error_handling (5 throw + catch)

# Perf Report — fn_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0047ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0053ms | -30.08% |
| p50 | 0.02ms | 0.02ms | -0.0026ms | -14.21% |
| p95 | 0.03ms | 0.02ms | +0.00050ms | +2.05% |
| p99 | 0.03ms | 0.03ms | +0.0037ms | +14.74% |
| mean | 0.02ms | 0.02ms | -0.0028ms | -14.27% |
| min | 0.01ms | 0.02ms | -0.0060ms | -34.60% |
| max | 0.03ms | 0.03ms | +0.0045ms | +17.82% |
| total | 0.33ms | 0.39ms | -0.06ms | -14.27% |

