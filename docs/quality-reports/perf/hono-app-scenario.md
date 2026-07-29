# Perf Suite — hono-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.02ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| rpc_client_batch (5 rpc calls) | 0.01ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| route_error_handling (5 throw + catch) | 0.03ms | 0.04ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.12ms | 200ms | PASS |
| rpc_client_batch (5 rpc calls) | 0.06ms | 200ms | PASS |
| route_error_handling (5 throw + catch) | 0.15ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 525544 B | 0 B | 102400 B | yes | PASS |
| rpc_client_batch (5 rpc calls) | 896 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 throw + catch) | -880 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0030ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00026ms | +1.21% |
| p50 | 0.02ms | 0.03ms | -0.0035ms | -13.84% |
| p95 | 0.03ms | 0.08ms | -0.05ms | -63.60% |
| p99 | 0.03ms | 0.64ms | -0.61ms | -95.01% |
| mean | 0.02ms | 0.06ms | -0.04ms | -62.95% |
| min | 0.02ms | 0.02ms | +0.00012ms | +0.59% |
| max | 0.03ms | 0.78ms | -0.74ms | -95.80% |
| total | 0.47ms | 1.27ms | -0.80ms | -62.95% |

### rpc_client_batch (5 rpc calls)

# Perf Report — rpc_client_batch (5 rpc calls).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0016ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00095ms | -6.43% |
| p50 | 0.02ms | 0.02ms | -0.00046ms | -2.95% |
| p95 | 0.02ms | 0.02ms | -0.00043ms | -2.34% |
| p99 | 0.02ms | 0.02ms | -0.00069ms | -3.50% |
| mean | 0.02ms | 0.02ms | -0.00093ms | -5.73% |
| min | 0.01ms | 0.01ms | -0.0021ms | -14.16% |
| max | 0.02ms | 0.02ms | -0.00075ms | -3.77% |
| total | 0.30ms | 0.32ms | -0.02ms | -5.73% |

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
| stdev | 0.0023ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0029ms | -7.63% |
| p50 | 0.04ms | 0.04ms | -0.00079ms | -2.08% |
| p95 | 0.04ms | 0.43ms | -0.39ms | -90.55% |
| p99 | 0.04ms | 0.43ms | -0.39ms | -90.39% |
| mean | 0.04ms | 0.08ms | -0.04ms | -54.07% |
| min | 0.03ms | 0.04ms | -0.0030ms | -8.01% |
| max | 0.04ms | 0.44ms | -0.39ms | -90.34% |
| total | 0.74ms | 1.62ms | -0.87ms | -54.07% |

