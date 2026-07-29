# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 0.77ms | 1.46ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| snapshot_batch (3 snapshot mode consecutive) | 0.37ms | 1.07ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| mount_error_handling (3 throw + catch during render) | 0.79ms | 3.08ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 4.56ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 4.93ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 4.26ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -164496 B | 0 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 9520 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4470488 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.77ms |
| p50 | 0.96ms |
| p95 | 1.46ms |
| p99 | 2.95ms |
| mean | 1.10ms |
| stdev | 0.56ms |
| min | 0.71ms |
| max | 3.32ms |
| total | 22.02ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.77ms | 0.65ms | +0.11ms | +17.17% |
| p50 | 0.96ms | 0.81ms | +0.16ms | +19.34% |
| p95 | 1.46ms | 1.26ms | +0.21ms | +16.38% |
| p99 | 2.95ms | 3.61ms | -0.66ms | -18.28% |
| mean | 1.10ms | 1.00ms | +0.10ms | +10.46% |
| min | 0.71ms | 0.60ms | +0.11ms | +17.61% |
| max | 3.32ms | 4.19ms | -0.88ms | -20.88% |
| total | 22.02ms | 19.94ms | +2.09ms | +10.46% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.37ms |
| p50 | 0.41ms |
| p95 | 1.07ms |
| p99 | 1.10ms |
| mean | 0.52ms |
| stdev | 0.23ms |
| min | 0.37ms |
| max | 1.11ms |
| total | 10.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.37ms | 0.38ms | -0.0089ms | -2.32% |
| p50 | 0.41ms | 0.45ms | -0.05ms | -10.08% |
| p95 | 1.07ms | 1.01ms | +0.06ms | +5.82% |
| p99 | 1.10ms | 1.31ms | -0.21ms | -16.21% |
| mean | 0.52ms | 0.52ms | -0.0040ms | -0.77% |
| min | 0.37ms | 0.38ms | -0.01ms | -3.48% |
| max | 1.11ms | 1.39ms | -0.28ms | -20.24% |
| total | 10.31ms | 10.39ms | -0.08ms | -0.77% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.79ms |
| p50 | 1.08ms |
| p95 | 3.08ms |
| p99 | 3.91ms |
| mean | 1.30ms |
| stdev | 0.83ms |
| min | 0.77ms |
| max | 4.12ms |
| total | 26.02ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.79ms | 0.96ms | -0.17ms | -17.41% |
| p50 | 1.08ms | 1.05ms | +0.02ms | +2.23% |
| p95 | 3.08ms | 4.05ms | -0.97ms | -23.91% |
| p99 | 3.91ms | 7.82ms | -3.90ms | -49.95% |
| mean | 1.30ms | 1.77ms | -0.47ms | -26.33% |
| min | 0.77ms | 0.92ms | -0.15ms | -16.30% |
| max | 4.12ms | 8.76ms | -4.64ms | -52.95% |
| total | 26.02ms | 35.32ms | -9.30ms | -26.33% |

