# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 0.70ms | 1.45ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| snapshot_batch (3 snapshot mode consecutive) | 0.39ms | 0.73ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| mount_error_handling (3 throw + catch during render) | 0.76ms | 2.19ms | 200ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 2.66ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 1.92ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 7.22ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -117392 B | 0 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 7032 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4477744 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.70ms |
| p50 | 0.85ms |
| p95 | 1.45ms |
| p99 | 2.17ms |
| mean | 0.97ms |
| stdev | 0.38ms |
| min | 0.64ms |
| max | 2.35ms |
| total | 19.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.70ms | 0.65ms | +0.05ms | +7.10% |
| p50 | 0.85ms | 0.81ms | +0.04ms | +5.38% |
| p95 | 1.45ms | 1.26ms | +0.19ms | +15.06% |
| p99 | 2.17ms | 3.61ms | -1.44ms | -39.81% |
| mean | 0.97ms | 1.00ms | -0.03ms | -2.96% |
| min | 0.64ms | 0.60ms | +0.04ms | +6.43% |
| max | 2.35ms | 4.19ms | -1.84ms | -43.92% |
| total | 19.35ms | 19.94ms | -0.59ms | -2.96% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.39ms |
| p50 | 0.43ms |
| p95 | 0.73ms |
| p99 | 0.75ms |
| mean | 0.47ms |
| stdev | 0.12ms |
| min | 0.36ms |
| max | 0.75ms |
| total | 9.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.39ms | 0.38ms | +0.0065ms | +1.68% |
| p50 | 0.43ms | 0.45ms | -0.02ms | -4.77% |
| p95 | 0.73ms | 1.01ms | -0.28ms | -27.60% |
| p99 | 0.75ms | 1.31ms | -0.57ms | -43.29% |
| mean | 0.47ms | 0.52ms | -0.05ms | -9.19% |
| min | 0.36ms | 0.38ms | -0.02ms | -6.16% |
| max | 0.75ms | 1.39ms | -0.64ms | -46.16% |
| total | 9.43ms | 10.39ms | -0.95ms | -9.19% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.76ms |
| p50 | 0.88ms |
| p95 | 2.19ms |
| p99 | 5.52ms |
| mean | 1.22ms |
| stdev | 1.23ms |
| min | 0.75ms |
| max | 6.35ms |
| total | 24.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.76ms | 0.96ms | -0.20ms | -20.65% |
| p50 | 0.88ms | 1.05ms | -0.18ms | -16.60% |
| p95 | 2.19ms | 4.05ms | -1.86ms | -45.83% |
| p99 | 5.52ms | 7.82ms | -2.30ms | -29.42% |
| mean | 1.22ms | 1.77ms | -0.55ms | -30.88% |
| min | 0.75ms | 0.92ms | -0.17ms | -18.38% |
| max | 6.35ms | 8.76ms | -2.41ms | -27.53% |
| total | 24.41ms | 35.32ms | -10.91ms | -30.88% |

