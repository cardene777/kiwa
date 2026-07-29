# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 0.65ms | 1.45ms | 200ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |
| snapshot_batch (3 snapshot mode consecutive) | 0.40ms | 0.58ms | 200ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |
| mount_error_handling (3 throw + catch during render) | 0.83ms | 1.56ms | 200ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 2.56ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 1.78ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 4.06ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -118336 B | 0 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | -4752 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4474792 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.65ms |
| p50 | 0.74ms |
| p95 | 1.45ms |
| p99 | 2.13ms |
| mean | 0.89ms |
| stdev | 0.39ms |
| min | 0.60ms |
| max | 2.30ms |
| total | 17.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.65ms | 0.65ms | -0.0068ms | -1.04% |
| p50 | 0.74ms | 0.81ms | -0.06ms | -7.93% |
| p95 | 1.45ms | 1.26ms | +0.19ms | +15.27% |
| p99 | 2.13ms | 3.61ms | -1.48ms | -41.04% |
| mean | 0.89ms | 1.00ms | -0.11ms | -11.19% |
| min | 0.60ms | 0.60ms | -0.0029ms | -0.48% |
| max | 2.30ms | 4.19ms | -1.90ms | -45.26% |
| total | 17.71ms | 19.94ms | -2.23ms | -11.19% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.40ms |
| p50 | 0.45ms |
| p95 | 0.58ms |
| p99 | 0.93ms |
| mean | 0.47ms |
| stdev | 0.13ms |
| min | 0.40ms |
| max | 1.02ms |
| total | 9.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.40ms | 0.38ms | +0.02ms | +4.54% |
| p50 | 0.45ms | 0.45ms | -0.0067ms | -1.47% |
| p95 | 0.58ms | 1.01ms | -0.43ms | -42.45% |
| p99 | 0.93ms | 1.31ms | -0.38ms | -29.21% |
| mean | 0.47ms | 0.52ms | -0.05ms | -8.69% |
| min | 0.40ms | 0.38ms | +0.02ms | +4.66% |
| max | 1.02ms | 1.39ms | -0.37ms | -26.79% |
| total | 9.49ms | 10.39ms | -0.90ms | -8.69% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.83ms |
| p50 | 1.00ms |
| p95 | 1.56ms |
| p99 | 3.06ms |
| mean | 1.11ms |
| stdev | 0.57ms |
| min | 0.76ms |
| max | 3.43ms |
| total | 22.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.83ms | 0.96ms | -0.13ms | -13.45% |
| p50 | 1.00ms | 1.05ms | -0.05ms | -5.08% |
| p95 | 1.56ms | 4.05ms | -2.49ms | -61.55% |
| p99 | 3.06ms | 7.82ms | -4.76ms | -60.89% |
| mean | 1.11ms | 1.77ms | -0.65ms | -37.04% |
| min | 0.76ms | 0.92ms | -0.17ms | -18.06% |
| max | 3.43ms | 8.76ms | -5.33ms | -60.82% |
| total | 22.24ms | 35.32ms | -13.08ms | -37.04% |

