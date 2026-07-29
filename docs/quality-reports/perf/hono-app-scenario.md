# Perf Suite — hono-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.02ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| rpc_client_batch (5 rpc calls) | 0.01ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| route_error_handling (5 throw + catch) | 0.03ms | 0.04ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.12ms | 200ms | PASS |
| rpc_client_batch (5 rpc calls) | 0.08ms | 200ms | PASS |
| route_error_handling (5 throw + catch) | 0.15ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | -189040 B | 0 B | 102400 B | yes | PASS |
| rpc_client_batch (5 rpc calls) | 976 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 throw + catch) | 880 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### route_workflow (10 invokeRoute GET+POST mix)

# Perf Report — route_workflow (10 invokeRoute GET+POST mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0041ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00038ms | -1.79% |
| p50 | 0.03ms | 0.03ms | -0.00044ms | -1.71% |
| p95 | 0.03ms | 0.08ms | -0.05ms | -58.44% |
| p99 | 0.04ms | 0.64ms | -0.60ms | -94.20% |
| mean | 0.03ms | 0.06ms | -0.04ms | -59.60% |
| min | 0.02ms | 0.02ms | -0.00075ms | -3.57% |
| max | 0.04ms | 0.78ms | -0.74ms | -95.10% |
| total | 0.51ms | 1.27ms | -0.76ms | -59.60% |

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
| stdev | 0.0012ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0020ms | -13.37% |
| p50 | 0.01ms | 0.02ms | -0.0010ms | -6.71% |
| p95 | 0.02ms | 0.02ms | -0.0020ms | -10.95% |
| p99 | 0.02ms | 0.02ms | -0.0025ms | -12.59% |
| mean | 0.01ms | 0.02ms | -0.0016ms | -10.07% |
| min | 0.01ms | 0.01ms | -0.0023ms | -15.58% |
| max | 0.02ms | 0.02ms | -0.0026ms | -12.97% |
| total | 0.29ms | 0.32ms | -0.03ms | -10.07% |

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
| stdev | 0.0027ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0039ms | -10.42% |
| p50 | 0.03ms | 0.04ms | -0.0041ms | -10.81% |
| p95 | 0.04ms | 0.43ms | -0.39ms | -90.46% |
| p99 | 0.04ms | 0.43ms | -0.39ms | -90.28% |
| mean | 0.04ms | 0.08ms | -0.05ms | -56.40% |
| min | 0.03ms | 0.04ms | -0.0041ms | -10.90% |
| max | 0.04ms | 0.44ms | -0.39ms | -90.23% |
| total | 0.71ms | 1.62ms | -0.91ms | -56.40% |

