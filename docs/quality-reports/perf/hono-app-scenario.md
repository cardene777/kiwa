# Perf Suite — hono-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.02ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| rpc_client_batch (5 rpc calls) | 0.01ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| route_error_handling (5 throw + catch) | 0.03ms | 0.05ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.10ms | 200ms | PASS |
| rpc_client_batch (5 rpc calls) | 0.06ms | 200ms | PASS |
| route_error_handling (5 throw + catch) | 0.17ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | -203952 B | 0 B | 102400 B | yes | PASS |
| rpc_client_batch (5 rpc calls) | 616 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 throw + catch) | 880 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0027ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00042ms | -1.97% |
| p50 | 0.02ms | 0.03ms | -0.0032ms | -12.62% |
| p95 | 0.03ms | 0.08ms | -0.05ms | -64.15% |
| p99 | 0.03ms | 0.64ms | -0.61ms | -95.51% |
| mean | 0.02ms | 0.06ms | -0.04ms | -63.27% |
| min | 0.02ms | 0.02ms | -0.00042ms | -1.98% |
| max | 0.03ms | 0.78ms | -0.75ms | -96.30% |
| total | 0.47ms | 1.27ms | -0.80ms | -63.27% |

### rpc_client_batch (5 rpc calls)

# Perf Report — rpc_client_batch (5 rpc calls).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0038ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0024ms | -16.23% |
| p50 | 0.01ms | 0.02ms | -0.0015ms | -9.54% |
| p95 | 0.02ms | 0.02ms | -0.0014ms | -7.55% |
| p99 | 0.03ms | 0.02ms | +0.0077ms | +39.31% |
| mean | 0.01ms | 0.02ms | -0.0015ms | -8.97% |
| min | 0.01ms | 0.01ms | -0.0025ms | -17.28% |
| max | 0.03ms | 0.02ms | +0.010ms | +50.21% |
| total | 0.29ms | 0.32ms | -0.03ms | -8.97% |

### route_error_handling (5 throw + catch)

# Perf Report — route_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.0034ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0035ms | -9.42% |
| p50 | 0.03ms | 0.04ms | -0.0032ms | -8.52% |
| p95 | 0.05ms | 0.43ms | -0.39ms | -89.53% |
| p99 | 0.05ms | 0.43ms | -0.39ms | -89.58% |
| mean | 0.04ms | 0.08ms | -0.04ms | -55.12% |
| min | 0.03ms | 0.04ms | -0.0035ms | -9.35% |
| max | 0.05ms | 0.44ms | -0.39ms | -89.59% |
| total | 0.73ms | 1.62ms | -0.89ms | -55.12% |

