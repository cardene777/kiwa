# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 0.79ms | 3.17ms | 200ms | 0.0012ms | PASS | regressed — gate 無効 (regressionGate=false) |
| snapshot_batch (3 snapshot mode consecutive) | 0.44ms | 0.55ms | 200ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |
| mount_error_handling (3 throw + catch during render) | 0.84ms | 4.02ms | 200ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 11.86ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 6.41ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 5.81ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -145216 B | -934 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 133952 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4475712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.79ms |
| p50 | 0.91ms |
| p95 | 3.17ms |
| p99 | 4.16ms |
| mean | 1.24ms |
| stdev | 0.92ms |
| min | 0.78ms |
| max | 4.41ms |
| total | 24.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.79ms | 0.65ms | +0.13ms | +20.53% |
| p50 | 0.91ms | 0.81ms | +0.10ms | +12.69% |
| p95 | 3.17ms | 1.26ms | +1.91ms | +152.16% |
| p99 | 4.16ms | 3.61ms | +0.56ms | +15.47% |
| mean | 1.24ms | 1.00ms | +0.24ms | +24.15% |
| min | 0.78ms | 0.60ms | +0.18ms | +29.48% |
| max | 4.41ms | 4.19ms | +0.22ms | +5.22% |
| total | 24.76ms | 19.94ms | +4.82ms | +24.15% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.44ms |
| p50 | 0.48ms |
| p95 | 0.55ms |
| p99 | 0.81ms |
| mean | 0.50ms |
| stdev | 0.09ms |
| min | 0.43ms |
| max | 0.88ms |
| total | 9.96ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.44ms | 0.38ms | +0.05ms | +13.97% |
| p50 | 0.48ms | 0.45ms | +0.02ms | +4.64% |
| p95 | 0.55ms | 1.01ms | -0.47ms | -46.20% |
| p99 | 0.81ms | 1.31ms | -0.50ms | -38.34% |
| mean | 0.50ms | 0.52ms | -0.02ms | -4.15% |
| min | 0.43ms | 0.38ms | +0.05ms | +13.23% |
| max | 0.88ms | 1.39ms | -0.51ms | -36.90% |
| total | 9.96ms | 10.39ms | -0.43ms | -4.15% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.84ms |
| p50 | 1.12ms |
| p95 | 4.02ms |
| p99 | 4.33ms |
| mean | 1.66ms |
| stdev | 1.10ms |
| min | 0.84ms |
| max | 4.41ms |
| total | 33.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.84ms | 0.96ms | -0.11ms | -11.97% |
| p50 | 1.12ms | 1.05ms | +0.06ms | +5.89% |
| p95 | 4.02ms | 4.05ms | -0.03ms | -0.75% |
| p99 | 4.33ms | 7.82ms | -3.49ms | -44.60% |
| mean | 1.66ms | 1.77ms | -0.11ms | -6.09% |
| min | 0.84ms | 0.92ms | -0.08ms | -9.16% |
| max | 4.41ms | 8.76ms | -4.35ms | -49.67% |
| total | 33.17ms | 35.32ms | -2.15ms | -6.09% |

