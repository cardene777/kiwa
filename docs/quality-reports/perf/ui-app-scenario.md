# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 0.67ms | 1.57ms | 200ms | 0.00049ms | PASS | stable (p10 +2% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| snapshot_batch (3 snapshot mode consecutive) | 0.38ms | 0.67ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| mount_error_handling (3 throw + catch during render) | 0.75ms | 1.69ms | 200ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 3.38ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 1.59ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 4.15ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -117768 B | 0 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | -8424 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4473824 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.67ms |
| p50 | 0.89ms |
| p95 | 1.57ms |
| p99 | 1.92ms |
| mean | 0.97ms |
| stdev | 0.34ms |
| min | 0.65ms |
| max | 2.01ms |
| total | 19.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.67ms | 0.65ms | +0.02ms | +2.38% |
| p50 | 0.89ms | 0.81ms | +0.08ms | +10.05% |
| p95 | 1.57ms | 1.26ms | +0.32ms | +25.19% |
| p99 | 1.92ms | 3.61ms | -1.68ms | -46.65% |
| mean | 0.97ms | 1.00ms | -0.03ms | -3.12% |
| min | 0.65ms | 0.60ms | +0.05ms | +8.33% |
| max | 2.01ms | 4.19ms | -2.18ms | -52.04% |
| total | 19.32ms | 19.94ms | -0.62ms | -3.12% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.38ms |
| p50 | 0.42ms |
| p95 | 0.67ms |
| p99 | 0.88ms |
| mean | 0.46ms |
| stdev | 0.13ms |
| min | 0.36ms |
| max | 0.93ms |
| total | 9.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.38ms | 0.38ms | -0.0033ms | -0.85% |
| p50 | 0.42ms | 0.45ms | -0.04ms | -8.31% |
| p95 | 0.67ms | 1.01ms | -0.34ms | -33.66% |
| p99 | 0.88ms | 1.31ms | -0.44ms | -33.36% |
| mean | 0.46ms | 0.52ms | -0.06ms | -12.40% |
| min | 0.36ms | 0.38ms | -0.02ms | -4.91% |
| max | 0.93ms | 1.39ms | -0.46ms | -33.30% |
| total | 9.10ms | 10.39ms | -1.29ms | -12.40% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.75ms |
| p50 | 0.93ms |
| p95 | 1.69ms |
| p99 | 2.54ms |
| mean | 1.07ms |
| stdev | 0.47ms |
| min | 0.75ms |
| max | 2.75ms |
| total | 21.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.75ms | 0.96ms | -0.20ms | -21.33% |
| p50 | 0.93ms | 1.05ms | -0.12ms | -11.38% |
| p95 | 1.69ms | 4.05ms | -2.36ms | -58.25% |
| p99 | 2.54ms | 7.82ms | -5.28ms | -67.56% |
| mean | 1.07ms | 1.77ms | -0.69ms | -39.16% |
| min | 0.75ms | 0.92ms | -0.18ms | -18.96% |
| max | 2.75ms | 8.76ms | -6.01ms | -68.63% |
| total | 21.49ms | 35.32ms | -13.83ms | -39.16% |

