# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 0.72ms | 1.04ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| snapshot_batch (3 snapshot mode consecutive) | 0.36ms | 0.47ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| mount_error_handling (3 throw + catch during render) | 0.81ms | 3.31ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 2.31ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 3.61ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 3.59ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -153080 B | 0 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 13920 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4474456 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.72ms |
| p50 | 0.81ms |
| p95 | 1.04ms |
| p99 | 1.04ms |
| mean | 0.84ms |
| stdev | 0.12ms |
| min | 0.72ms |
| max | 1.04ms |
| total | 16.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.72ms | 0.65ms | +0.07ms | +9.96% |
| p50 | 0.81ms | 0.81ms | +0.0011ms | +0.13% |
| p95 | 1.04ms | 1.26ms | -0.22ms | -17.22% |
| p99 | 1.04ms | 3.61ms | -2.56ms | -71.05% |
| mean | 0.84ms | 1.00ms | -0.16ms | -15.76% |
| min | 0.72ms | 0.60ms | +0.11ms | +18.78% |
| max | 1.04ms | 4.19ms | -3.15ms | -75.08% |
| total | 16.80ms | 19.94ms | -3.14ms | -15.76% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.36ms |
| p50 | 0.39ms |
| p95 | 0.47ms |
| p99 | 0.49ms |
| mean | 0.40ms |
| stdev | 0.04ms |
| min | 0.34ms |
| max | 0.50ms |
| total | 7.96ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.36ms | 0.38ms | -0.03ms | -7.37% |
| p50 | 0.39ms | 0.45ms | -0.06ms | -13.26% |
| p95 | 0.47ms | 1.01ms | -0.54ms | -53.65% |
| p99 | 0.49ms | 1.31ms | -0.82ms | -62.61% |
| mean | 0.40ms | 0.52ms | -0.12ms | -23.34% |
| min | 0.34ms | 0.38ms | -0.04ms | -11.71% |
| max | 0.50ms | 1.39ms | -0.89ms | -64.24% |
| total | 7.96ms | 10.39ms | -2.42ms | -23.34% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.81ms |
| p50 | 0.90ms |
| p95 | 3.31ms |
| p99 | 3.61ms |
| mean | 1.20ms |
| stdev | 0.82ms |
| min | 0.78ms |
| max | 3.69ms |
| total | 24.00ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.81ms | 0.96ms | -0.15ms | -15.21% |
| p50 | 0.90ms | 1.05ms | -0.15ms | -14.46% |
| p95 | 3.31ms | 4.05ms | -0.74ms | -18.31% |
| p99 | 3.61ms | 7.82ms | -4.21ms | -53.81% |
| mean | 1.20ms | 1.77ms | -0.57ms | -32.04% |
| min | 0.78ms | 0.92ms | -0.14ms | -15.29% |
| max | 3.69ms | 8.76ms | -5.07ms | -57.91% |
| total | 24.00ms | 35.32ms | -11.32ms | -32.04% |

