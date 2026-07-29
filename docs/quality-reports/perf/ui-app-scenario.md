# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 0.64ms | 1.39ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| snapshot_batch (3 snapshot mode consecutive) | 0.37ms | 0.75ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| mount_error_handling (3 throw + catch during render) | 0.73ms | 1.18ms | 200ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 2.61ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 1.67ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 3.96ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -111112 B | 0 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | -4712 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4477944 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.64ms |
| p50 | 0.77ms |
| p95 | 1.39ms |
| p99 | 1.68ms |
| mean | 0.86ms |
| stdev | 0.28ms |
| min | 0.58ms |
| max | 1.75ms |
| total | 17.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.64ms | 0.65ms | -0.0098ms | -1.49% |
| p50 | 0.77ms | 0.81ms | -0.04ms | -5.21% |
| p95 | 1.39ms | 1.26ms | +0.14ms | +10.77% |
| p99 | 1.68ms | 3.61ms | -1.93ms | -53.51% |
| mean | 0.86ms | 1.00ms | -0.14ms | -13.62% |
| min | 0.58ms | 0.60ms | -0.02ms | -3.54% |
| max | 1.75ms | 4.19ms | -2.45ms | -58.33% |
| total | 17.22ms | 19.94ms | -2.72ms | -13.62% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.37ms |
| p50 | 0.41ms |
| p95 | 0.75ms |
| p99 | 0.81ms |
| mean | 0.47ms |
| stdev | 0.13ms |
| min | 0.35ms |
| max | 0.82ms |
| total | 9.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.37ms | 0.38ms | -0.01ms | -3.57% |
| p50 | 0.41ms | 0.45ms | -0.05ms | -10.71% |
| p95 | 0.75ms | 1.01ms | -0.27ms | -26.17% |
| p99 | 0.81ms | 1.31ms | -0.51ms | -38.54% |
| mean | 0.47ms | 0.52ms | -0.05ms | -10.42% |
| min | 0.35ms | 0.38ms | -0.03ms | -8.30% |
| max | 0.82ms | 1.39ms | -0.57ms | -40.80% |
| total | 9.31ms | 10.39ms | -1.08ms | -10.42% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.73ms |
| p50 | 0.85ms |
| p95 | 1.18ms |
| p99 | 1.99ms |
| mean | 0.93ms |
| stdev | 0.32ms |
| min | 0.71ms |
| max | 2.19ms |
| total | 18.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.73ms | 0.96ms | -0.22ms | -23.46% |
| p50 | 0.85ms | 1.05ms | -0.21ms | -19.90% |
| p95 | 1.18ms | 4.05ms | -2.87ms | -70.93% |
| p99 | 1.99ms | 7.82ms | -5.83ms | -74.54% |
| mean | 0.93ms | 1.77ms | -0.84ms | -47.54% |
| min | 0.71ms | 0.92ms | -0.21ms | -22.71% |
| max | 2.19ms | 8.76ms | -6.57ms | -74.95% |
| total | 18.53ms | 35.32ms | -16.79ms | -47.54% |

