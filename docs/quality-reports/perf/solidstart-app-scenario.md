# Perf Suite — solidstart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.0083ms | 0.01ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| api_route_batch (5 invokeApiRoute) | 0.06ms | 0.10ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| fn_error_handling (5 throw + catch) | 0.02ms | 0.10ms | 100ms | 0.00050ms | PASS | stable (p10 +12% (閾値未満)、 p95 +300% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.03ms | 200ms | PASS |
| api_route_batch (5 invokeApiRoute) | 0.99ms | 200ms | PASS |
| fn_error_handling (5 throw + catch) | 0.30ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 11984 B | 0 B | 102400 B | yes | PASS |
| api_route_batch (5 invokeApiRoute) | 12208 B | 1800 B | 102400 B | yes | PASS |
| fn_error_handling (5 throw + catch) | 13496 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### server_function_workflow (10 invokeServerFunction)

# Perf Report — server_function_workflow (10 invokeServerFunction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0083ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0034ms |
| min | 0.0083ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0083ms | 0.0044ms | +0.0040ms | +90.49% |
| p50 | 0.01ms | 0.0045ms | +0.0057ms | +127.18% |
| p95 | 0.01ms | 0.0056ms | +0.0087ms | +157.35% |
| p99 | 0.02ms | 0.0057ms | +0.02ms | +271.67% |
| mean | 0.01ms | 0.0047ms | +0.0062ms | +133.33% |
| min | 0.0083ms | 0.0044ms | +0.0040ms | +90.47% |
| max | 0.02ms | 0.0057ms | +0.02ms | +299.27% |
| total | 0.22ms | 0.09ms | +0.12ms | +133.33% |

### api_route_batch (5 invokeApiRoute)

# Perf Report — api_route_batch (5 invokeApiRoute).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.06ms |
| p50 | 0.07ms |
| p95 | 0.10ms |
| p99 | 0.13ms |
| mean | 0.08ms |
| stdev | 0.02ms |
| min | 0.06ms |
| max | 0.14ms |
| total | 1.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.05ms | +0.0080ms | +14.92% |
| p50 | 0.07ms | 0.08ms | -0.0050ms | -6.64% |
| p95 | 0.10ms | 0.27ms | -0.16ms | -61.34% |
| p99 | 0.13ms | 0.99ms | -0.86ms | -86.86% |
| mean | 0.08ms | 0.13ms | -0.06ms | -42.77% |
| min | 0.06ms | 0.05ms | +0.0086ms | +16.37% |
| max | 0.14ms | 1.17ms | -1.03ms | -88.32% |
| total | 1.54ms | 2.68ms | -1.15ms | -42.77% |

### fn_error_handling (5 throw + catch)

# Perf Report — fn_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.10ms |
| p99 | 0.20ms |
| mean | 0.04ms |
| stdev | 0.05ms |
| min | 0.02ms |
| max | 0.23ms |
| total | 0.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0021ms | +11.98% |
| p50 | 0.02ms | 0.02ms | +0.0034ms | +18.23% |
| p95 | 0.10ms | 0.02ms | +0.07ms | +299.69% |
| p99 | 0.20ms | 0.03ms | +0.18ms | +716.41% |
| mean | 0.04ms | 0.02ms | +0.02ms | +104.93% |
| min | 0.02ms | 0.02ms | +0.0013ms | +7.17% |
| max | 0.23ms | 0.03ms | +0.21ms | +817.49% |
| total | 0.79ms | 0.39ms | +0.41ms | +104.93% |

