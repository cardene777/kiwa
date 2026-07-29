# Perf Suite — qwikcity-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.0071ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.0042ms | 0.0088ms | 100ms | 0.00050ms | PASS | stable (p10 +1% (閾値未満)、 p95 +23% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| loader_error_handling (5 throw + catch) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.05ms | 200ms | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.02ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.09ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 1672 B | 0 B | 102400 B | yes | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | -7744 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | 1008 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### route_loader_workflow (10 invokeRouteLoader)

# Perf Report — route_loader_workflow (10 invokeRouteLoader).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0071ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0045ms |
| min | 0.0070ms |
| max | 0.03ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0071ms | 0.0071ms | -0.000046ms | -0.65% |
| p50 | 0.01ms | 0.0073ms | +0.0030ms | +41.19% |
| p95 | 0.01ms | 0.02ms | -0.0027ms | -16.32% |
| p99 | 0.02ms | 0.02ms | +0.0077ms | +44.98% |
| mean | 0.01ms | 0.0090ms | +0.0014ms | +15.62% |
| min | 0.0070ms | 0.0071ms | -0.000083ms | -1.16% |
| max | 0.03ms | 0.02ms | +0.01ms | +59.42% |
| total | 0.21ms | 0.18ms | +0.03ms | +15.62% |

### route_action_form_batch (5 invokeRouteAction with FormData)

# Perf Report — route_action_form_batch (5 invokeRouteAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0042ms |
| p50 | 0.0060ms |
| p95 | 0.0088ms |
| p99 | 0.01ms |
| mean | 0.0060ms |
| stdev | 0.0015ms |
| min | 0.0042ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0042ms | 0.0042ms | +0.000042ms | +1.01% |
| p50 | 0.0060ms | 0.0057ms | +0.00023ms | +4.00% |
| p95 | 0.0088ms | 0.0072ms | +0.0017ms | +23.47% |
| p99 | 0.01ms | 0.01ms | -0.0026ms | -20.14% |
| mean | 0.0060ms | 0.0058ms | +0.00018ms | +3.15% |
| min | 0.0042ms | 0.0041ms | +0.000083ms | +2.01% |
| max | 0.01ms | 0.01ms | -0.0036ms | -25.66% |
| total | 0.12ms | 0.12ms | +0.0037ms | +3.15% |

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
| total | 0.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00054ms | -2.67% |
| p50 | 0.02ms | 0.02ms | +0.00021ms | +1.02% |
| p95 | 0.03ms | 0.02ms | +0.0016ms | +6.46% |
| p99 | 0.03ms | 0.03ms | +0.000047ms | +0.17% |
| mean | 0.02ms | 0.02ms | +0.000073ms | +0.34% |
| min | 0.02ms | 0.02ms | -0.00058ms | -2.89% |
| max | 0.03ms | 0.03ms | -0.00033ms | -1.17% |
| total | 0.43ms | 0.43ms | +0.0015ms | +0.34% |

