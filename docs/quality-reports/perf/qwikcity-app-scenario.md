# Perf Suite — qwikcity-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.0071ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.0045ms | 0.0073ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| loader_error_handling (5 throw + catch) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.04ms | 200ms | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.03ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.09ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 12208 B | 0 B | 102400 B | yes | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | -7632 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | 1408 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### route_loader_workflow (10 invokeRouteLoader)

# Perf Report — route_loader_workflow (10 invokeRouteLoader).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0071ms |
| p50 | 0.0086ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0094ms |
| stdev | 0.0026ms |
| min | 0.0070ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0071ms | 0.0071ms | -0.000041ms | -0.58% |
| p50 | 0.0086ms | 0.0073ms | +0.0013ms | +17.90% |
| p95 | 0.02ms | 0.02ms | -0.00068ms | -4.21% |
| p99 | 0.02ms | 0.02ms | -0.00097ms | -5.69% |
| mean | 0.0094ms | 0.0090ms | +0.00037ms | +4.06% |
| min | 0.0070ms | 0.0071ms | -0.000084ms | -1.18% |
| max | 0.02ms | 0.02ms | -0.0010ms | -6.04% |
| total | 0.19ms | 0.18ms | +0.0073ms | +4.06% |

### route_action_form_batch (5 invokeRouteAction with FormData)

# Perf Report — route_action_form_batch (5 invokeRouteAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0045ms |
| p50 | 0.0057ms |
| p95 | 0.0073ms |
| p99 | 0.01ms |
| mean | 0.0060ms |
| stdev | 0.0020ms |
| min | 0.0041ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0042ms | +0.00038ms | +9.09% |
| p50 | 0.0057ms | 0.0057ms | -0.000043ms | -0.74% |
| p95 | 0.0073ms | 0.0072ms | +0.00010ms | +1.44% |
| p99 | 0.01ms | 0.01ms | -0.00025ms | -1.94% |
| mean | 0.0060ms | 0.0058ms | +0.00016ms | +2.76% |
| min | 0.0041ms | 0.0041ms | -0.000042ms | -1.02% |
| max | 0.01ms | 0.01ms | -0.00033ms | -2.36% |
| total | 0.12ms | 0.12ms | +0.0032ms | +2.76% |

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
| stdev | 0.0022ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0011ms | +5.39% |
| p50 | 0.02ms | 0.02ms | +0.0016ms | +7.71% |
| p95 | 0.03ms | 0.02ms | +0.0034ms | +14.06% |
| p99 | 0.03ms | 0.03ms | +0.00078ms | +2.83% |
| mean | 0.02ms | 0.02ms | +0.0015ms | +6.95% |
| min | 0.02ms | 0.02ms | +0.00083ms | +4.14% |
| max | 0.03ms | 0.03ms | +0.00013ms | +0.44% |
| total | 0.46ms | 0.43ms | +0.03ms | +6.95% |

