# Perf Suite — hono-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.02ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| rpc_client_batch (5 rpc calls) | 0.01ms | 0.03ms | 100ms | 0.00049ms | PASS | stable (p10 +0% (閾値未満)、 p95 +39% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| route_error_handling (5 throw + catch) | 0.03ms | 0.04ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.17ms | 200ms | PASS |
| rpc_client_batch (5 rpc calls) | 0.08ms | 200ms | PASS |
| route_error_handling (5 throw + catch) | 0.19ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 15496 B | 0 B | 102400 B | yes | PASS |
| rpc_client_batch (5 rpc calls) | -480 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 throw + catch) | 304 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### route_workflow (10 invokeRoute GET+POST mix)

# Perf Report — route_workflow (10 invokeRoute GET+POST mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0035ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00099ms | -4.68% |
| p50 | 0.02ms | 0.03ms | -0.0050ms | -19.46% |
| p95 | 0.03ms | 0.08ms | -0.05ms | -61.65% |
| p99 | 0.03ms | 0.64ms | -0.61ms | -95.21% |
| mean | 0.02ms | 0.06ms | -0.04ms | -64.38% |
| min | 0.02ms | 0.02ms | -0.00092ms | -4.36% |
| max | 0.03ms | 0.78ms | -0.75ms | -96.05% |
| total | 0.45ms | 1.27ms | -0.82ms | -64.38% |

### rpc_client_batch (5 rpc calls)

# Perf Report — rpc_client_batch (5 rpc calls).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0041ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0000078ms | +0.05% |
| p50 | 0.02ms | 0.02ms | +0.00054ms | +3.49% |
| p95 | 0.03ms | 0.02ms | +0.0072ms | +38.64% |
| p99 | 0.03ms | 0.02ms | +0.0071ms | +35.98% |
| mean | 0.02ms | 0.02ms | +0.0020ms | +12.51% |
| min | 0.01ms | 0.01ms | -0.00071ms | -4.81% |
| max | 0.03ms | 0.02ms | +0.0070ms | +35.36% |
| total | 0.36ms | 0.32ms | +0.04ms | +12.51% |

### route_error_handling (5 throw + catch)

# Perf Report — route_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.04ms |
| stdev | 0.0025ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0033ms | -8.66% |
| p50 | 0.03ms | 0.04ms | -0.0033ms | -8.68% |
| p95 | 0.04ms | 0.43ms | -0.39ms | -90.34% |
| p99 | 0.04ms | 0.43ms | -0.39ms | -89.99% |
| mean | 0.04ms | 0.08ms | -0.04ms | -55.38% |
| min | 0.03ms | 0.04ms | -0.0033ms | -8.79% |
| max | 0.04ms | 0.44ms | -0.39ms | -89.90% |
| total | 0.72ms | 1.62ms | -0.90ms | -55.38% |

