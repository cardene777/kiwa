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
| route_workflow (10 invokeRoute GET+POST mix) | 0.11ms | 200ms | PASS |
| rpc_client_batch (5 rpc calls) | 0.06ms | 200ms | PASS |
| route_error_handling (5 throw + catch) | 0.16ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | -340800 B | 0 B | 102400 B | yes | PASS |
| rpc_client_batch (5 rpc calls) | 1408 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 throw + catch) | 976 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.07ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.08ms |
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00017ms | +0.80% |
| p50 | 0.02ms | 0.03ms | -0.0020ms | -7.82% |
| p95 | 0.03ms | 0.08ms | -0.05ms | -59.73% |
| p99 | 0.07ms | 0.64ms | -0.56ms | -88.61% |
| mean | 0.03ms | 0.06ms | -0.04ms | -57.54% |
| min | 0.02ms | 0.02ms | -0.00079ms | -3.76% |
| max | 0.08ms | 0.78ms | -0.69ms | -89.33% |
| total | 0.54ms | 1.27ms | -0.73ms | -57.54% |

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
| stdev | 0.0019ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0015ms | -10.26% |
| p50 | 0.02ms | 0.02ms | -0.000041ms | -0.27% |
| p95 | 0.02ms | 0.02ms | +0.00032ms | +1.72% |
| p99 | 0.02ms | 0.02ms | +0.000096ms | +0.49% |
| mean | 0.02ms | 0.02ms | -0.00051ms | -3.17% |
| min | 0.01ms | 0.01ms | -0.0018ms | -12.18% |
| max | 0.02ms | 0.02ms | +0.000041ms | +0.21% |
| total | 0.31ms | 0.32ms | -0.01ms | -3.17% |

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
| stdev | 0.0028ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.75ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0028ms | -7.41% |
| p50 | 0.04ms | 0.04ms | -0.00056ms | -1.47% |
| p95 | 0.04ms | 0.43ms | -0.39ms | -89.77% |
| p99 | 0.04ms | 0.43ms | -0.39ms | -89.82% |
| mean | 0.04ms | 0.08ms | -0.04ms | -53.49% |
| min | 0.03ms | 0.04ms | -0.0030ms | -7.90% |
| max | 0.04ms | 0.44ms | -0.39ms | -89.83% |
| total | 0.75ms | 1.62ms | -0.87ms | -53.49% |

