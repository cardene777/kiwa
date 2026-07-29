# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 0.77ms | 3.02ms | 200ms | 0.00050ms | PASS | stable (p10 +17% (閾値未満)、 p95 +140% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| snapshot_batch (3 snapshot mode consecutive) | 0.43ms | 0.89ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| mount_error_handling (3 throw + catch during render) | 0.84ms | 2.01ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 2.78ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 1.71ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 57.24ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -127192 B | 0 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | -7984 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4475824 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.77ms |
| p50 | 1.15ms |
| p95 | 3.02ms |
| p99 | 3.73ms |
| mean | 1.41ms |
| stdev | 0.83ms |
| min | 0.76ms |
| max | 3.91ms |
| total | 28.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.77ms | 0.65ms | +0.11ms | +17.34% |
| p50 | 1.15ms | 0.81ms | +0.34ms | +41.96% |
| p95 | 3.02ms | 1.26ms | +1.76ms | +140.05% |
| p99 | 3.73ms | 3.61ms | +0.12ms | +3.46% |
| mean | 1.41ms | 1.00ms | +0.41ms | +41.60% |
| min | 0.76ms | 0.60ms | +0.16ms | +25.80% |
| max | 3.91ms | 4.19ms | -0.28ms | -6.78% |
| total | 28.23ms | 19.94ms | +8.29ms | +41.60% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.43ms |
| p50 | 0.48ms |
| p95 | 0.89ms |
| p99 | 0.97ms |
| mean | 0.57ms |
| stdev | 0.18ms |
| min | 0.43ms |
| max | 0.99ms |
| total | 11.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.43ms | 0.38ms | +0.05ms | +12.64% |
| p50 | 0.48ms | 0.45ms | +0.03ms | +5.67% |
| p95 | 0.89ms | 1.01ms | -0.13ms | -12.48% |
| p99 | 0.97ms | 1.31ms | -0.34ms | -26.12% |
| mean | 0.57ms | 0.52ms | +0.05ms | +10.29% |
| min | 0.43ms | 0.38ms | +0.04ms | +11.78% |
| max | 0.99ms | 1.39ms | -0.40ms | -28.61% |
| total | 11.46ms | 10.39ms | +1.07ms | +10.29% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.84ms |
| p50 | 1.00ms |
| p95 | 2.01ms |
| p99 | 5.90ms |
| mean | 1.31ms |
| stdev | 1.32ms |
| min | 0.82ms |
| max | 6.87ms |
| total | 26.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.84ms | 0.96ms | -0.12ms | -12.29% |
| p50 | 1.00ms | 1.05ms | -0.06ms | -5.31% |
| p95 | 2.01ms | 4.05ms | -2.04ms | -50.42% |
| p99 | 5.90ms | 7.82ms | -1.92ms | -24.58% |
| mean | 1.31ms | 1.77ms | -0.46ms | -25.87% |
| min | 0.82ms | 0.92ms | -0.10ms | -10.75% |
| max | 6.87ms | 8.76ms | -1.89ms | -21.60% |
| total | 26.18ms | 35.32ms | -9.14ms | -25.87% |

