# Perf Suite — qwikcity-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.0075ms | 0.05ms | 100ms | 0.00050ms | PASS | stable (p10 +5% (閾値未満)、 p95 +183% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.0059ms | 0.0082ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| loader_error_handling (5 throw + catch) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable (p10 +13% (閾値未満)、 p95 +22% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.04ms | 200ms | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.03ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 12648 B | 0 B | 102400 B | yes | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | -7584 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | 1408 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### route_loader_workflow (10 invokeRouteLoader)

# Perf Report — route_loader_workflow (10 invokeRouteLoader).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0075ms |
| p50 | 0.0087ms |
| p95 | 0.05ms |
| p99 | 0.11ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.0074ms |
| max | 0.13ms |
| total | 0.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0075ms | 0.0071ms | +0.00037ms | +5.21% |
| p50 | 0.0087ms | 0.0073ms | +0.0014ms | +19.03% |
| p95 | 0.05ms | 0.02ms | +0.03ms | +183.49% |
| p99 | 0.11ms | 0.02ms | +0.10ms | +565.14% |
| mean | 0.02ms | 0.0090ms | +0.01ms | +128.14% |
| min | 0.0074ms | 0.0071ms | +0.00029ms | +4.10% |
| max | 0.13ms | 0.02ms | +0.11ms | +655.07% |
| total | 0.41ms | 0.18ms | +0.23ms | +128.14% |

### route_action_form_batch (5 invokeRouteAction with FormData)

# Perf Report — route_action_form_batch (5 invokeRouteAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0059ms |
| p50 | 0.0071ms |
| p95 | 0.0082ms |
| p99 | 0.0085ms |
| mean | 0.0071ms |
| stdev | 0.00085ms |
| min | 0.0059ms |
| max | 0.0086ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0042ms | +0.0017ms | +40.99% |
| p50 | 0.0071ms | 0.0057ms | +0.0014ms | +24.36% |
| p95 | 0.0082ms | 0.0072ms | +0.0011ms | +14.94% |
| p99 | 0.0085ms | 0.01ms | -0.0042ms | -33.14% |
| mean | 0.0071ms | 0.0058ms | +0.0013ms | +22.02% |
| min | 0.0059ms | 0.0041ms | +0.0017ms | +42.42% |
| max | 0.0086ms | 0.01ms | -0.0055ms | -39.23% |
| total | 0.14ms | 0.12ms | +0.03ms | +22.02% |

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
| stdev | 0.0024ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0026ms | +12.75% |
| p50 | 0.02ms | 0.02ms | +0.0029ms | +14.10% |
| p95 | 0.03ms | 0.02ms | +0.0054ms | +22.44% |
| p99 | 0.03ms | 0.03ms | +0.0033ms | +12.03% |
| mean | 0.02ms | 0.02ms | +0.0031ms | +14.63% |
| min | 0.02ms | 0.02ms | +0.0026ms | +13.02% |
| max | 0.03ms | 0.03ms | +0.0028ms | +9.81% |
| total | 0.49ms | 0.43ms | +0.06ms | +14.63% |

