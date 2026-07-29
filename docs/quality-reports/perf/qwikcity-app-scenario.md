# Perf Suite — qwikcity-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.0070ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.0043ms | 0.01ms | 100ms | 0.00050ms | PASS | stable (p10 +2% (閾値未満)、 p95 +43% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| loader_error_handling (5 throw + catch) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.04ms | 200ms | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.02ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.14ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 112544 B | 0 B | 102400 B | yes | PASS |
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
| p50 | 0.0079ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0091ms |
| stdev | 0.0041ms |
| min | 0.0069ms |
| max | 0.03ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0070ms | 0.0071ms | -0.00017ms | -2.40% |
| p50 | 0.0079ms | 0.0073ms | +0.00056ms | +7.67% |
| p95 | 0.01ms | 0.02ms | -0.0043ms | -26.25% |
| p99 | 0.02ms | 0.02ms | +0.0056ms | +32.72% |
| mean | 0.0091ms | 0.0090ms | +0.000042ms | +0.46% |
| min | 0.0069ms | 0.0071ms | -0.00025ms | -3.51% |
| max | 0.03ms | 0.02ms | +0.0080ms | +46.62% |
| total | 0.18ms | 0.18ms | +0.00084ms | +0.46% |

### route_action_form_batch (5 invokeRouteAction with FormData)

# Perf Report — route_action_form_batch (5 invokeRouteAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0043ms |
| p50 | 0.0067ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0065ms |
| stdev | 0.0025ms |
| min | 0.0042ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0043ms | 0.0042ms | +0.000083ms | +1.99% |
| p50 | 0.0067ms | 0.0057ms | +0.0010ms | +17.45% |
| p95 | 0.01ms | 0.0072ms | +0.0031ms | +43.14% |
| p99 | 0.01ms | 0.01ms | -0.000016ms | -0.13% |
| mean | 0.0065ms | 0.0058ms | +0.00071ms | +12.30% |
| min | 0.0042ms | 0.0041ms | +0.000083ms | +2.01% |
| max | 0.01ms | 0.01ms | -0.00079ms | -5.61% |
| total | 0.13ms | 0.12ms | +0.01ms | +12.30% |

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
| stdev | 0.0026ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0000041ms | +0.02% |
| p50 | 0.02ms | 0.02ms | +0.00048ms | +2.33% |
| p95 | 0.03ms | 0.02ms | +0.0036ms | +14.78% |
| p99 | 0.03ms | 0.03ms | +0.00045ms | +1.63% |
| mean | 0.02ms | 0.02ms | +0.00094ms | +4.38% |
| min | 0.02ms | 0.02ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.03ms | -0.00033ms | -1.17% |
| total | 0.45ms | 0.43ms | +0.02ms | +4.38% |

