# Perf Suite — solidstart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.0033ms | 0.0071ms | 100ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |
| api_route_batch (5 invokeApiRoute) | 0.05ms | 0.09ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| fn_error_handling (5 throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.02ms | 200ms | PASS |
| api_route_batch (5 invokeApiRoute) | 0.23ms | 200ms | PASS |
| fn_error_handling (5 throw + catch) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 9008 B | 0 B | 102400 B | yes | PASS |
| api_route_batch (5 invokeApiRoute) | 10960 B | 0 B | 102400 B | yes | PASS |
| fn_error_handling (5 throw + catch) | 632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### server_function_workflow (10 invokeServerFunction)

# Perf Report — server_function_workflow (10 invokeServerFunction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0033ms |
| p50 | 0.0035ms |
| p95 | 0.0071ms |
| p99 | 0.0099ms |
| mean | 0.0043ms |
| stdev | 0.0017ms |
| min | 0.0033ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0033ms | 0.0044ms | -0.0011ms | -24.75% |
| p50 | 0.0035ms | 0.0045ms | -0.0010ms | -22.12% |
| p95 | 0.0071ms | 0.0056ms | +0.0015ms | +27.84% |
| p99 | 0.0099ms | 0.0057ms | +0.0041ms | +72.53% |
| mean | 0.0043ms | 0.0047ms | -0.00038ms | -8.24% |
| min | 0.0033ms | 0.0044ms | -0.0011ms | -24.78% |
| max | 0.01ms | 0.0057ms | +0.0048ms | +83.32% |
| total | 0.09ms | 0.09ms | -0.0077ms | -8.24% |

### api_route_batch (5 invokeApiRoute)

# Perf Report — api_route_batch (5 invokeApiRoute).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.09ms |
| p99 | 0.10ms |
| mean | 0.07ms |
| stdev | 0.01ms |
| min | 0.05ms |
| max | 0.11ms |
| total | 1.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.00076ms | -1.41% |
| p50 | 0.06ms | 0.08ms | -0.01ms | -17.39% |
| p95 | 0.09ms | 0.27ms | -0.17ms | -65.44% |
| p99 | 0.10ms | 0.99ms | -0.88ms | -89.48% |
| mean | 0.07ms | 0.13ms | -0.07ms | -50.85% |
| min | 0.05ms | 0.05ms | -0.00021ms | -0.40% |
| max | 0.11ms | 1.17ms | -1.06ms | -90.86% |
| total | 1.32ms | 2.68ms | -1.36ms | -50.85% |

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
| stdev | 0.0043ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0064ms | -36.67% |
| p50 | 0.02ms | 0.02ms | -0.0023ms | -12.20% |
| p95 | 0.02ms | 0.02ms | -0.0051ms | -20.69% |
| p99 | 0.03ms | 0.03ms | +0.0015ms | +5.92% |
| mean | 0.02ms | 0.02ms | -0.0039ms | -20.25% |
| min | 0.01ms | 0.02ms | -0.0064ms | -36.76% |
| max | 0.03ms | 0.03ms | +0.0031ms | +12.38% |
| total | 0.31ms | 0.39ms | -0.08ms | -20.25% |

