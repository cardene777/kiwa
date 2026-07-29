# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 0.75ms | 2.98ms | 200ms | 0.00050ms | PASS | stable (p10 +15% (閾値未満)、 p95 +137% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| snapshot_batch (3 snapshot mode consecutive) | 0.43ms | 0.53ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| mount_error_handling (3 throw + catch during render) | 0.85ms | 1.65ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 2.89ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 3.58ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 4.43ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -171664 B | 0 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 8152 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4474480 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.75ms |
| p50 | 0.87ms |
| p95 | 2.98ms |
| p99 | 3.11ms |
| mean | 1.16ms |
| stdev | 0.73ms |
| min | 0.69ms |
| max | 3.14ms |
| total | 23.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.75ms | 0.65ms | +0.10ms | +15.08% |
| p50 | 0.87ms | 0.81ms | +0.06ms | +7.71% |
| p95 | 2.98ms | 1.26ms | +1.73ms | +137.38% |
| p99 | 3.11ms | 3.61ms | -0.50ms | -13.82% |
| mean | 1.16ms | 1.00ms | +0.16ms | +16.02% |
| min | 0.69ms | 0.60ms | +0.09ms | +14.88% |
| max | 3.14ms | 4.19ms | -1.05ms | -25.16% |
| total | 23.13ms | 19.94ms | +3.19ms | +16.02% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.43ms |
| p50 | 0.45ms |
| p95 | 0.53ms |
| p99 | 0.59ms |
| mean | 0.47ms |
| stdev | 0.04ms |
| min | 0.42ms |
| max | 0.60ms |
| total | 9.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.43ms | 0.38ms | +0.05ms | +12.81% |
| p50 | 0.45ms | 0.45ms | -0.0063ms | -1.38% |
| p95 | 0.53ms | 1.01ms | -0.48ms | -47.58% |
| p99 | 0.59ms | 1.31ms | -0.73ms | -55.19% |
| mean | 0.47ms | 0.52ms | -0.05ms | -10.38% |
| min | 0.42ms | 0.38ms | +0.04ms | +10.62% |
| max | 0.60ms | 1.39ms | -0.79ms | -56.57% |
| total | 9.31ms | 10.39ms | -1.08ms | -10.38% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.85ms |
| p50 | 1.01ms |
| p95 | 1.65ms |
| p99 | 4.09ms |
| mean | 1.19ms |
| stdev | 0.84ms |
| min | 0.84ms |
| max | 4.70ms |
| total | 23.83ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.85ms | 0.96ms | -0.11ms | -11.16% |
| p50 | 1.01ms | 1.05ms | -0.05ms | -4.38% |
| p95 | 1.65ms | 4.05ms | -2.40ms | -59.32% |
| p99 | 4.09ms | 7.82ms | -3.73ms | -47.70% |
| mean | 1.19ms | 1.77ms | -0.57ms | -32.54% |
| min | 0.84ms | 0.92ms | -0.08ms | -8.90% |
| max | 4.70ms | 8.76ms | -4.06ms | -46.36% |
| total | 23.83ms | 35.32ms | -11.49ms | -32.54% |

