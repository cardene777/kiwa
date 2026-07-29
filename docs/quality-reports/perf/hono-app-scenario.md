# Perf Suite — hono-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.02ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| rpc_client_batch (5 rpc calls) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| route_error_handling (5 throw + catch) | 0.03ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.15ms | 200ms | PASS |
| rpc_client_batch (5 rpc calls) | 0.12ms | 200ms | PASS |
| route_error_handling (5 throw + catch) | 0.16ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | -251040 B | 0 B | 102400 B | yes | PASS |
| rpc_client_batch (5 rpc calls) | 976 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 throw + catch) | 368 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### route_workflow (10 invokeRoute GET+POST mix)

# Perf Report — route_workflow (10 invokeRoute GET+POST mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.07ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.08ms |
| total | 0.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00058ms | -2.74% |
| p50 | 0.02ms | 0.03ms | -0.0042ms | -16.37% |
| p95 | 0.04ms | 0.08ms | -0.04ms | -54.26% |
| p99 | 0.07ms | 0.64ms | -0.57ms | -89.06% |
| mean | 0.03ms | 0.06ms | -0.04ms | -59.12% |
| min | 0.02ms | 0.02ms | -0.00050ms | -2.38% |
| max | 0.08ms | 0.78ms | -0.70ms | -89.94% |
| total | 0.52ms | 1.27ms | -0.75ms | -59.12% |

### rpc_client_batch (5 rpc calls)

# Perf Report — rpc_client_batch (5 rpc calls).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0018ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0019ms | -13.06% |
| p50 | 0.01ms | 0.02ms | -0.0023ms | -14.50% |
| p95 | 0.02ms | 0.02ms | -0.0012ms | -6.64% |
| p99 | 0.02ms | 0.02ms | -0.0016ms | -8.04% |
| mean | 0.01ms | 0.02ms | -0.0021ms | -13.04% |
| min | 0.01ms | 0.01ms | -0.0021ms | -14.16% |
| max | 0.02ms | 0.02ms | -0.0017ms | -8.37% |
| total | 0.28ms | 0.32ms | -0.04ms | -13.04% |

### route_error_handling (5 throw + catch)

# Perf Report — route_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.04ms |
| stdev | 0.0027ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0041ms | -10.96% |
| p50 | 0.04ms | 0.04ms | -0.0030ms | -7.92% |
| p95 | 0.04ms | 0.43ms | -0.39ms | -90.22% |
| p99 | 0.04ms | 0.43ms | -0.39ms | -90.23% |
| mean | 0.04ms | 0.08ms | -0.05ms | -55.84% |
| min | 0.03ms | 0.04ms | -0.0041ms | -11.01% |
| max | 0.04ms | 0.44ms | -0.39ms | -90.24% |
| total | 0.71ms | 1.62ms | -0.90ms | -55.84% |

