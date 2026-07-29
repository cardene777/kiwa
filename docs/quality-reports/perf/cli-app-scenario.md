# Perf Suite — cli-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00033ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00066ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 2.06ms | 2.84ms | 500ms | 0.00066ms | PASS | improved — gate 無効 (regressionGate=false) |
| spec_to_test_batch (5 consecutive runSpecToTest) | 0.38ms | 0.69ms | 300ms | 0.00066ms | PASS | improved — gate 無効 (regressionGate=false) |
| init_error_handling (3 InitConflictError catch) | 0.67ms | 1.01ms | 500ms | 0.00066ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 9.74ms | 1000ms | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | 3.19ms | 600ms | PASS |
| init_error_handling (3 InitConflictError catch) | 3.09ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 9112 B | 0 B | 102400 B | yes | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | -1704 B | 0 B | 102400 B | yes | PASS |
| init_error_handling (3 InitConflictError catch) | 5320 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### init_workflow (3 fresh project scaffold)

# Perf Report — init_workflow (3 fresh project scaffold).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 2.06ms |
| p50 | 2.27ms |
| p95 | 2.84ms |
| p99 | 3.45ms |
| mean | 2.37ms |
| stdev | 0.37ms |
| min | 1.90ms |
| max | 3.60ms |
| total | 47.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 2.06ms | 3.53ms | -1.47ms | -41.75% |
| p50 | 2.27ms | 5.63ms | -3.36ms | -59.69% |
| p95 | 2.84ms | 12.29ms | -9.46ms | -76.91% |
| p99 | 3.45ms | 12.47ms | -9.03ms | -72.37% |
| mean | 2.37ms | 6.73ms | -4.36ms | -64.82% |
| min | 1.90ms | 3.07ms | -1.17ms | -38.10% |
| max | 3.60ms | 12.52ms | -8.92ms | -71.26% |
| total | 47.36ms | 134.62ms | -87.26ms | -64.82% |

### spec_to_test_batch (5 consecutive runSpecToTest)

# Perf Report — spec_to_test_batch (5 consecutive runSpecToTest).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.38ms |
| p50 | 0.50ms |
| p95 | 0.69ms |
| p99 | 0.70ms |
| mean | 0.52ms |
| stdev | 0.11ms |
| min | 0.38ms |
| max | 0.70ms |
| total | 10.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.38ms | 0.51ms | -0.13ms | -24.99% |
| p50 | 0.50ms | 0.57ms | -0.07ms | -12.14% |
| p95 | 0.69ms | 1.16ms | -0.47ms | -40.69% |
| p99 | 0.70ms | 1.27ms | -0.57ms | -44.88% |
| mean | 0.52ms | 0.63ms | -0.10ms | -16.65% |
| min | 0.38ms | 0.45ms | -0.08ms | -17.23% |
| max | 0.70ms | 1.30ms | -0.60ms | -45.82% |
| total | 10.49ms | 12.59ms | -2.10ms | -16.65% |

### init_error_handling (3 InitConflictError catch)

# Perf Report — init_error_handling (3 InitConflictError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.67ms |
| p50 | 0.77ms |
| p95 | 1.01ms |
| p99 | 1.21ms |
| mean | 0.79ms |
| stdev | 0.14ms |
| min | 0.62ms |
| max | 1.26ms |
| total | 15.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.67ms | 0.83ms | -0.16ms | -19.52% |
| p50 | 0.77ms | 1.06ms | -0.30ms | -28.10% |
| p95 | 1.01ms | 1.69ms | -0.68ms | -40.29% |
| p99 | 1.21ms | 1.72ms | -0.51ms | -29.52% |
| mean | 0.79ms | 1.13ms | -0.34ms | -30.02% |
| min | 0.62ms | 0.77ms | -0.15ms | -19.04% |
| max | 1.26ms | 1.72ms | -0.46ms | -26.88% |
| total | 15.77ms | 22.54ms | -6.77ms | -30.02% |

