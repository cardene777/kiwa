# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 0.65ms | 1.37ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| snapshot_batch (3 snapshot mode consecutive) | 0.37ms | 0.50ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| mount_error_handling (3 throw + catch during render) | 0.77ms | 1.41ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 2.58ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 1.64ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 4.08ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -118144 B | 0 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | -4952 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4475032 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.65ms |
| p50 | 0.83ms |
| p95 | 1.37ms |
| p99 | 2.70ms |
| mean | 0.95ms |
| stdev | 0.52ms |
| min | 0.60ms |
| max | 3.03ms |
| total | 19.00ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.65ms | 0.65ms | -0.0057ms | -0.87% |
| p50 | 0.83ms | 0.81ms | +0.02ms | +2.49% |
| p95 | 1.37ms | 1.26ms | +0.11ms | +9.06% |
| p99 | 2.70ms | 3.61ms | -0.91ms | -25.17% |
| mean | 0.95ms | 1.00ms | -0.05ms | -4.70% |
| min | 0.60ms | 0.60ms | -0.0029ms | -0.48% |
| max | 3.03ms | 4.19ms | -1.16ms | -27.73% |
| total | 19.00ms | 19.94ms | -0.94ms | -4.70% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.37ms |
| p50 | 0.39ms |
| p95 | 0.50ms |
| p99 | 0.55ms |
| mean | 0.40ms |
| stdev | 0.05ms |
| min | 0.36ms |
| max | 0.56ms |
| total | 8.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.37ms | 0.38ms | -0.02ms | -4.14% |
| p50 | 0.39ms | 0.45ms | -0.07ms | -14.64% |
| p95 | 0.50ms | 1.01ms | -0.51ms | -50.48% |
| p99 | 0.55ms | 1.31ms | -0.77ms | -58.25% |
| mean | 0.40ms | 0.52ms | -0.12ms | -22.25% |
| min | 0.36ms | 0.38ms | -0.02ms | -6.16% |
| max | 0.56ms | 1.39ms | -0.83ms | -59.66% |
| total | 8.08ms | 10.39ms | -2.31ms | -22.25% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.77ms |
| p50 | 0.83ms |
| p95 | 1.41ms |
| p99 | 2.31ms |
| mean | 0.97ms |
| stdev | 0.40ms |
| min | 0.75ms |
| max | 2.53ms |
| total | 19.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.77ms | 0.96ms | -0.19ms | -19.55% |
| p50 | 0.83ms | 1.05ms | -0.22ms | -20.88% |
| p95 | 1.41ms | 4.05ms | -2.64ms | -65.09% |
| p99 | 2.31ms | 7.82ms | -5.51ms | -70.49% |
| mean | 0.97ms | 1.77ms | -0.80ms | -45.10% |
| min | 0.75ms | 0.92ms | -0.18ms | -19.31% |
| max | 2.53ms | 8.76ms | -6.23ms | -71.11% |
| total | 19.39ms | 35.32ms | -15.93ms | -45.10% |

