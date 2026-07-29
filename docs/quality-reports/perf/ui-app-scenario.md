# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 0.76ms | 2.02ms | 200ms | 0.0012ms | PASS | stable (p10 +16% (閾値未満)、 p95 +61% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| snapshot_batch (3 snapshot mode consecutive) | 0.35ms | 0.72ms | 200ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |
| mount_error_handling (3 throw + catch during render) | 0.85ms | 1.55ms | 200ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 2.55ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 4.87ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 4.36ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -119168 B | 0 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 4624 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4470416 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.76ms |
| p50 | 0.89ms |
| p95 | 2.02ms |
| p99 | 2.59ms |
| mean | 1.04ms |
| stdev | 0.49ms |
| min | 0.66ms |
| max | 2.73ms |
| total | 20.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.76ms | 0.65ms | +0.11ms | +16.07% |
| p50 | 0.89ms | 0.81ms | +0.09ms | +10.63% |
| p95 | 2.02ms | 1.26ms | +0.76ms | +60.51% |
| p99 | 2.59ms | 3.61ms | -1.01ms | -28.14% |
| mean | 1.04ms | 1.00ms | +0.04ms | +4.19% |
| min | 0.66ms | 0.60ms | +0.06ms | +9.89% |
| max | 2.73ms | 4.19ms | -1.46ms | -34.78% |
| total | 20.78ms | 19.94ms | +0.84ms | +4.19% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.35ms |
| p50 | 0.39ms |
| p95 | 0.72ms |
| p99 | 1.31ms |
| mean | 0.47ms |
| stdev | 0.25ms |
| min | 0.33ms |
| max | 1.46ms |
| total | 9.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.35ms | 0.38ms | -0.03ms | -9.11% |
| p50 | 0.39ms | 0.45ms | -0.06ms | -13.23% |
| p95 | 0.72ms | 1.01ms | -0.29ms | -28.73% |
| p99 | 1.31ms | 1.31ms | -0.0012ms | -0.09% |
| mean | 0.47ms | 0.52ms | -0.05ms | -9.91% |
| min | 0.33ms | 0.38ms | -0.05ms | -12.52% |
| max | 1.46ms | 1.39ms | +0.07ms | +5.14% |
| total | 9.36ms | 10.39ms | -1.03ms | -9.91% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.85ms |
| p50 | 1.05ms |
| p95 | 1.55ms |
| p99 | 2.41ms |
| mean | 1.16ms |
| stdev | 0.40ms |
| min | 0.80ms |
| max | 2.62ms |
| total | 23.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.85ms | 0.96ms | -0.11ms | -11.60% |
| p50 | 1.05ms | 1.05ms | -0.0081ms | -0.77% |
| p95 | 1.55ms | 4.05ms | -2.50ms | -61.67% |
| p99 | 2.41ms | 7.82ms | -5.41ms | -69.19% |
| mean | 1.16ms | 1.77ms | -0.61ms | -34.29% |
| min | 0.80ms | 0.92ms | -0.12ms | -13.43% |
| max | 2.62ms | 8.76ms | -6.14ms | -70.06% |
| total | 23.21ms | 35.32ms | -12.11ms | -34.29% |

