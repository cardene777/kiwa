# Perf Suite — qwikcity-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.0070ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.0042ms | 0.0073ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| loader_error_handling (5 throw + catch) | 0.02ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.04ms | 200ms | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.02ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.09ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 263408 B | 0 B | 102400 B | yes | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | -8544 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | 928 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### route_loader_workflow (10 invokeRouteLoader)

# Perf Report — route_loader_workflow (10 invokeRouteLoader).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0070ms |
| p50 | 0.0073ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0093ms |
| stdev | 0.0050ms |
| min | 0.0070ms |
| max | 0.03ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0070ms | 0.0071ms | -0.00013ms | -1.81% |
| p50 | 0.0073ms | 0.0073ms | -0.000021ms | -0.29% |
| p95 | 0.01ms | 0.02ms | -0.0039ms | -24.03% |
| p99 | 0.03ms | 0.02ms | +0.0089ms | +52.10% |
| mean | 0.0093ms | 0.0090ms | +0.00030ms | +3.28% |
| min | 0.0070ms | 0.0071ms | -0.00017ms | -2.34% |
| max | 0.03ms | 0.02ms | +0.01ms | +70.05% |
| total | 0.19ms | 0.18ms | +0.0059ms | +3.28% |

### route_action_form_batch (5 invokeRouteAction with FormData)

# Perf Report — route_action_form_batch (5 invokeRouteAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0042ms |
| p50 | 0.0058ms |
| p95 | 0.0073ms |
| p99 | 0.01ms |
| mean | 0.0060ms |
| stdev | 0.0024ms |
| min | 0.0041ms |
| max | 0.02ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0042ms | 0.0042ms | -0.0000041ms | -0.10% |
| p50 | 0.0058ms | 0.0057ms | +0.000021ms | +0.37% |
| p95 | 0.0073ms | 0.0072ms | +0.00016ms | +2.25% |
| p99 | 0.01ms | 0.01ms | +0.0013ms | +10.46% |
| mean | 0.0060ms | 0.0058ms | +0.00017ms | +2.91% |
| min | 0.0041ms | 0.0041ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0016ms | +11.50% |
| total | 0.12ms | 0.12ms | +0.0034ms | +2.91% |

### loader_error_handling (5 throw + catch)

# Perf Report — loader_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0021ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00053ms | -2.59% |
| p50 | 0.02ms | 0.02ms | -0.00010ms | -0.51% |
| p95 | 0.03ms | 0.02ms | +0.00086ms | +3.54% |
| p99 | 0.03ms | 0.03ms | -0.000028ms | -0.10% |
| mean | 0.02ms | 0.02ms | -0.00020ms | -0.94% |
| min | 0.02ms | 0.02ms | -0.00050ms | -2.47% |
| max | 0.03ms | 0.03ms | -0.00025ms | -0.88% |
| total | 0.43ms | 0.43ms | -0.0040ms | -0.94% |

