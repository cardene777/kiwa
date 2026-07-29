# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 0.75ms | 1.08ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| snapshot_batch (3 snapshot mode consecutive) | 0.45ms | 0.66ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| mount_error_handling (3 throw + catch during render) | 0.79ms | 1.80ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 2.89ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 1.72ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 3.97ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -116552 B | 0 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | -10552 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4470400 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.75ms |
| p50 | 0.87ms |
| p95 | 1.08ms |
| p99 | 1.15ms |
| mean | 0.88ms |
| stdev | 0.12ms |
| min | 0.72ms |
| max | 1.17ms |
| total | 17.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.75ms | 0.65ms | +0.10ms | +14.68% |
| p50 | 0.87ms | 0.81ms | +0.07ms | +8.14% |
| p95 | 1.08ms | 1.26ms | -0.18ms | -14.21% |
| p99 | 1.15ms | 3.61ms | -2.45ms | -68.03% |
| mean | 0.88ms | 1.00ms | -0.12ms | -11.78% |
| min | 0.72ms | 0.60ms | +0.12ms | +20.12% |
| max | 1.17ms | 4.19ms | -3.02ms | -72.06% |
| total | 17.59ms | 19.94ms | -2.35ms | -11.78% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.45ms |
| p50 | 0.47ms |
| p95 | 0.66ms |
| p99 | 0.68ms |
| mean | 0.49ms |
| stdev | 0.07ms |
| min | 0.43ms |
| max | 0.68ms |
| total | 9.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.45ms | 0.38ms | +0.06ms | +16.24% |
| p50 | 0.47ms | 0.45ms | +0.02ms | +3.41% |
| p95 | 0.66ms | 1.01ms | -0.36ms | -35.05% |
| p99 | 0.68ms | 1.31ms | -0.64ms | -48.45% |
| mean | 0.49ms | 0.52ms | -0.03ms | -5.17% |
| min | 0.43ms | 0.38ms | +0.05ms | +12.65% |
| max | 0.68ms | 1.39ms | -0.71ms | -50.90% |
| total | 9.85ms | 10.39ms | -0.54ms | -5.17% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.79ms |
| p50 | 1.03ms |
| p95 | 1.80ms |
| p99 | 4.31ms |
| mean | 1.21ms |
| stdev | 0.91ms |
| min | 0.77ms |
| max | 4.94ms |
| total | 24.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.79ms | 0.96ms | -0.17ms | -17.67% |
| p50 | 1.03ms | 1.05ms | -0.03ms | -2.50% |
| p95 | 1.80ms | 4.05ms | -2.25ms | -55.44% |
| p99 | 4.31ms | 7.82ms | -3.51ms | -44.85% |
| mean | 1.21ms | 1.77ms | -0.55ms | -31.22% |
| min | 0.77ms | 0.92ms | -0.16ms | -16.98% |
| max | 4.94ms | 8.76ms | -3.82ms | -43.63% |
| total | 24.29ms | 35.32ms | -11.03ms | -31.22% |

