# Perf Suite — qwikcity-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.0098ms | 0.01ms | 100ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.0065ms | 0.0091ms | 100ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| loader_error_handling (5 throw + catch) | 0.02ms | 0.10ms | 100ms | 0.00042ms | PASS | stable (p10 +3% (閾値未満)、 p95 +305% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.27ms | 200ms | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.04ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | -4208 B | 0 B | 102400 B | yes | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | -7632 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | 400 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### route_loader_workflow (10 invokeRouteLoader)

# Perf Report — route_loader_workflow (10 invokeRouteLoader).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0098ms |
| p50 | 0.010ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00055ms |
| min | 0.0097ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0098ms | 0.0071ms | +0.0027ms | +38.02% |
| p50 | 0.010ms | 0.0073ms | +0.0026ms | +35.79% |
| p95 | 0.01ms | 0.02ms | -0.0048ms | -29.68% |
| p99 | 0.01ms | 0.02ms | -0.0053ms | -31.27% |
| mean | 0.01ms | 0.0090ms | +0.0012ms | +13.03% |
| min | 0.0097ms | 0.0071ms | +0.0026ms | +36.84% |
| max | 0.01ms | 0.02ms | -0.0055ms | -31.64% |
| total | 0.20ms | 0.18ms | +0.02ms | +13.03% |

### route_action_form_batch (5 invokeRouteAction with FormData)

# Perf Report — route_action_form_batch (5 invokeRouteAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0065ms |
| p50 | 0.0070ms |
| p95 | 0.0091ms |
| p99 | 0.0093ms |
| mean | 0.0072ms |
| stdev | 0.00084ms |
| min | 0.0063ms |
| max | 0.0093ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0065ms | 0.0042ms | +0.0023ms | +55.69% |
| p50 | 0.0070ms | 0.0057ms | +0.0013ms | +22.54% |
| p95 | 0.0091ms | 0.0072ms | +0.0019ms | +26.53% |
| p99 | 0.0093ms | 0.01ms | -0.0035ms | -27.13% |
| mean | 0.0072ms | 0.0058ms | +0.0014ms | +24.35% |
| min | 0.0063ms | 0.0041ms | +0.0021ms | +51.52% |
| max | 0.0093ms | 0.01ms | -0.0048ms | -33.93% |
| total | 0.14ms | 0.12ms | +0.03ms | +24.35% |

### loader_error_handling (5 throw + catch)

# Perf Report — loader_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.10ms |
| p99 | 0.26ms |
| mean | 0.05ms |
| stdev | 0.06ms |
| min | 0.02ms |
| max | 0.31ms |
| total | 0.92ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00064ms | +3.15% |
| p50 | 0.02ms | 0.02ms | +0.0024ms | +11.56% |
| p95 | 0.10ms | 0.02ms | +0.07ms | +305.20% |
| p99 | 0.26ms | 0.03ms | +0.24ms | +855.49% |
| mean | 0.05ms | 0.02ms | +0.02ms | +113.45% |
| min | 0.02ms | 0.02ms | +0.00058ms | +2.90% |
| max | 0.31ms | 0.03ms | +0.28ms | +972.78% |
| total | 0.92ms | 0.43ms | +0.49ms | +113.45% |

