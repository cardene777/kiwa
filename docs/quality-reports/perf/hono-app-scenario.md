# Perf Suite — hono-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| rpc_client_batch (5 rpc calls) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| route_error_handling (5 throw + catch) | 0.04ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.10ms | 200ms | PASS |
| rpc_client_batch (5 rpc calls) | 0.06ms | 200ms | PASS |
| route_error_handling (5 throw + catch) | 0.16ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 27224 B | 0 B | 102400 B | yes | PASS |
| rpc_client_batch (5 rpc calls) | 1520 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 throw + catch) | -312 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0036ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00037ms | -1.75% |
| p50 | 0.02ms | 0.03ms | -0.0039ms | -15.07% |
| p95 | 0.03ms | 0.08ms | -0.05ms | -61.64% |
| p99 | 0.03ms | 0.64ms | -0.61ms | -95.20% |
| mean | 0.02ms | 0.06ms | -0.04ms | -62.70% |
| min | 0.02ms | 0.02ms | -0.00033ms | -1.59% |
| max | 0.03ms | 0.78ms | -0.75ms | -96.04% |
| total | 0.47ms | 1.27ms | -0.80ms | -62.70% |

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
| stdev | 0.0013ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0017ms | -11.68% |
| p50 | 0.01ms | 0.02ms | -0.0010ms | -6.58% |
| p95 | 0.02ms | 0.02ms | -0.0021ms | -11.36% |
| p99 | 0.02ms | 0.02ms | -0.0031ms | -15.72% |
| mean | 0.01ms | 0.02ms | -0.0016ms | -10.13% |
| min | 0.01ms | 0.01ms | -0.0026ms | -17.85% |
| max | 0.02ms | 0.02ms | -0.0033ms | -16.73% |
| total | 0.29ms | 0.32ms | -0.03ms | -10.13% |

### route_error_handling (5 throw + catch)

# Perf Report — route_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.0027ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.0023ms | -6.23% |
| p50 | 0.04ms | 0.04ms | -0.00033ms | -0.87% |
| p95 | 0.04ms | 0.43ms | -0.39ms | -89.99% |
| p99 | 0.05ms | 0.43ms | -0.39ms | -89.55% |
| mean | 0.04ms | 0.08ms | -0.04ms | -52.91% |
| min | 0.04ms | 0.04ms | -0.0024ms | -6.45% |
| max | 0.05ms | 0.44ms | -0.39ms | -89.45% |
| total | 0.76ms | 1.62ms | -0.86ms | -52.91% |

