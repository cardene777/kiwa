# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 0.61ms | 1.37ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| snapshot_batch (3 snapshot mode consecutive) | 0.33ms | 0.46ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| mount_error_handling (3 throw + catch during render) | 0.75ms | 2.02ms | 200ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 3.18ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 2.10ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 8.12ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -117144 B | 0 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 3832 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4474264 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.61ms |
| p50 | 0.74ms |
| p95 | 1.37ms |
| p99 | 3.47ms |
| mean | 0.95ms |
| stdev | 0.74ms |
| min | 0.58ms |
| max | 4.00ms |
| total | 19.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.61ms | 0.65ms | -0.04ms | -5.98% |
| p50 | 0.74ms | 0.81ms | -0.07ms | -8.44% |
| p95 | 1.37ms | 1.26ms | +0.11ms | +8.81% |
| p99 | 3.47ms | 3.61ms | -0.13ms | -3.74% |
| mean | 0.95ms | 1.00ms | -0.05ms | -4.52% |
| min | 0.58ms | 0.60ms | -0.02ms | -3.33% |
| max | 4.00ms | 4.19ms | -0.20ms | -4.68% |
| total | 19.04ms | 19.94ms | -0.90ms | -4.52% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.33ms |
| p50 | 0.38ms |
| p95 | 0.46ms |
| p99 | 0.50ms |
| mean | 0.38ms |
| stdev | 0.05ms |
| min | 0.32ms |
| max | 0.51ms |
| total | 7.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.33ms | 0.38ms | -0.05ms | -14.01% |
| p50 | 0.38ms | 0.45ms | -0.07ms | -16.34% |
| p95 | 0.46ms | 1.01ms | -0.56ms | -55.02% |
| p99 | 0.50ms | 1.31ms | -0.82ms | -62.20% |
| mean | 0.38ms | 0.52ms | -0.14ms | -26.29% |
| min | 0.32ms | 0.38ms | -0.06ms | -15.67% |
| max | 0.51ms | 1.39ms | -0.88ms | -63.51% |
| total | 7.66ms | 10.39ms | -2.73ms | -26.29% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.75ms |
| p50 | 0.91ms |
| p95 | 2.02ms |
| p99 | 4.06ms |
| mean | 1.24ms |
| stdev | 0.86ms |
| min | 0.74ms |
| max | 4.57ms |
| total | 24.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.75ms | 0.96ms | -0.21ms | -21.51% |
| p50 | 0.91ms | 1.05ms | -0.14ms | -13.52% |
| p95 | 2.02ms | 4.05ms | -2.03ms | -50.14% |
| p99 | 4.06ms | 7.82ms | -3.76ms | -48.09% |
| mean | 1.24ms | 1.77ms | -0.53ms | -29.85% |
| min | 0.74ms | 0.92ms | -0.19ms | -20.08% |
| max | 4.57ms | 8.76ms | -4.19ms | -47.86% |
| total | 24.78ms | 35.32ms | -10.54ms | -29.85% |

