# Perf Suite — qwikcity-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.0097ms | 0.02ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.0045ms | 0.0078ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| loader_error_handling (5 throw + catch) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.04ms | 200ms | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.03ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 9080 B | 0 B | 102400 B | yes | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | -7744 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | 0 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### route_loader_workflow (10 invokeRouteLoader)

# Perf Report — route_loader_workflow (10 invokeRouteLoader).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0097ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0025ms |
| min | 0.0084ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0097ms | 0.0071ms | +0.0026ms | +36.84% |
| p50 | 0.01ms | 0.0073ms | +0.0035ms | +47.16% |
| p95 | 0.02ms | 0.02ms | +0.0015ms | +9.28% |
| p99 | 0.02ms | 0.02ms | +0.0016ms | +9.59% |
| mean | 0.01ms | 0.0090ms | +0.0024ms | +26.58% |
| min | 0.0084ms | 0.0071ms | +0.0013ms | +17.54% |
| max | 0.02ms | 0.02ms | +0.0017ms | +9.66% |
| total | 0.23ms | 0.18ms | +0.05ms | +26.58% |

### route_action_form_batch (5 invokeRouteAction with FormData)

# Perf Report — route_action_form_batch (5 invokeRouteAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0045ms |
| p50 | 0.0063ms |
| p95 | 0.0078ms |
| p99 | 0.01ms |
| mean | 0.0063ms |
| stdev | 0.0021ms |
| min | 0.0045ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0042ms | +0.00038ms | +9.00% |
| p50 | 0.0063ms | 0.0057ms | +0.00056ms | +9.82% |
| p95 | 0.0078ms | 0.0072ms | +0.00065ms | +9.13% |
| p99 | 0.01ms | 0.01ms | +0.00043ms | +3.38% |
| mean | 0.0063ms | 0.0058ms | +0.00050ms | +8.54% |
| min | 0.0045ms | 0.0041ms | +0.00037ms | +9.09% |
| max | 0.01ms | 0.01ms | +0.00038ms | +2.65% |
| total | 0.13ms | 0.12ms | +0.0099ms | +8.54% |

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
| stdev | 0.0020ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0020ms | +9.67% |
| p50 | 0.02ms | 0.02ms | +0.0023ms | +11.16% |
| p95 | 0.03ms | 0.02ms | +0.0037ms | +15.41% |
| p99 | 0.03ms | 0.03ms | +0.0010ms | +3.80% |
| mean | 0.02ms | 0.02ms | +0.0023ms | +10.60% |
| min | 0.02ms | 0.02ms | +0.0020ms | +9.92% |
| max | 0.03ms | 0.03ms | +0.00038ms | +1.32% |
| total | 0.47ms | 0.43ms | +0.05ms | +10.60% |

