# Perf Suite — solidstart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.0034ms | 0.0071ms | 100ms | 0.00050ms | PASS | stable (p10 -21% (閾値未満)、 p95 +28% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| api_route_batch (5 invokeApiRoute) | 0.06ms | 0.11ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| fn_error_handling (5 throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.02ms | 200ms | PASS |
| api_route_batch (5 invokeApiRoute) | 0.40ms | 200ms | PASS |
| fn_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 9712 B | 0 B | 102400 B | yes | PASS |
| api_route_batch (5 invokeApiRoute) | -5840 B | 0 B | 102400 B | yes | PASS |
| fn_error_handling (5 throw + catch) | 632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### server_function_workflow (10 invokeServerFunction)

# Perf Report — server_function_workflow (10 invokeServerFunction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0034ms |
| p50 | 0.0045ms |
| p95 | 0.0071ms |
| p99 | 0.0088ms |
| mean | 0.0047ms |
| stdev | 0.0013ms |
| min | 0.0033ms |
| max | 0.0092ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0044ms | -0.00093ms | -21.23% |
| p50 | 0.0045ms | 0.0045ms | -0.000021ms | -0.46% |
| p95 | 0.0071ms | 0.0056ms | +0.0016ms | +28.06% |
| p99 | 0.0088ms | 0.0057ms | +0.0031ms | +53.90% |
| mean | 0.0047ms | 0.0047ms | +0.000083ms | +1.79% |
| min | 0.0033ms | 0.0044ms | -0.0011ms | -24.75% |
| max | 0.0092ms | 0.0057ms | +0.0035ms | +60.14% |
| total | 0.09ms | 0.09ms | +0.0017ms | +1.79% |

### api_route_batch (5 invokeApiRoute)

# Perf Report — api_route_batch (5 invokeApiRoute).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.06ms |
| p50 | 0.07ms |
| p95 | 0.11ms |
| p99 | 0.14ms |
| mean | 0.08ms |
| stdev | 0.03ms |
| min | 0.05ms |
| max | 0.15ms |
| total | 1.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.05ms | +0.0040ms | +7.49% |
| p50 | 0.07ms | 0.08ms | -0.0059ms | -7.85% |
| p95 | 0.11ms | 0.27ms | -0.15ms | -57.37% |
| p99 | 0.14ms | 0.99ms | -0.84ms | -85.50% |
| mean | 0.08ms | 0.13ms | -0.06ms | -41.02% |
| min | 0.05ms | 0.05ms | +0.00033ms | +0.64% |
| max | 0.15ms | 1.17ms | -1.01ms | -87.11% |
| total | 1.58ms | 2.68ms | -1.10ms | -41.02% |

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
| stdev | 0.0055ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0061ms | -34.98% |
| p50 | 0.02ms | 0.02ms | -0.0015ms | -8.06% |
| p95 | 0.02ms | 0.02ms | -0.0041ms | -16.68% |
| p99 | 0.03ms | 0.03ms | +0.0073ms | +29.02% |
| mean | 0.02ms | 0.02ms | -0.0028ms | -14.71% |
| min | 0.01ms | 0.02ms | -0.0061ms | -35.08% |
| max | 0.04ms | 0.03ms | +0.01ms | +40.10% |
| total | 0.33ms | 0.39ms | -0.06ms | -14.71% |

