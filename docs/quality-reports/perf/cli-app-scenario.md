# Perf Suite — cli-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00058ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 2.03ms | 2.93ms | 500ms | 0.00058ms | PASS | improved — gate 無効 (regressionGate=false) |
| spec_to_test_batch (5 consecutive runSpecToTest) | 0.40ms | 0.66ms | 300ms | 0.00058ms | PASS | improved — gate 無効 (regressionGate=false) |
| init_error_handling (3 InitConflictError catch) | 0.74ms | 0.93ms | 500ms | 0.00058ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 9.36ms | 1000ms | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | 2.06ms | 600ms | PASS |
| init_error_handling (3 InitConflictError catch) | 3.53ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 9272 B | 0 B | 102400 B | yes | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | -1624 B | 0 B | 102400 B | yes | PASS |
| init_error_handling (3 InitConflictError catch) | 5320 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### init_workflow (3 fresh project scaffold)

# Perf Report — init_workflow (3 fresh project scaffold).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 2.03ms |
| p50 | 2.42ms |
| p95 | 2.93ms |
| p99 | 3.17ms |
| mean | 2.42ms |
| stdev | 0.31ms |
| min | 1.93ms |
| max | 3.23ms |
| total | 48.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 2.03ms | 3.53ms | -1.50ms | -42.54% |
| p50 | 2.42ms | 5.63ms | -3.21ms | -57.06% |
| p95 | 2.93ms | 12.29ms | -9.37ms | -76.18% |
| p99 | 3.17ms | 12.47ms | -9.30ms | -74.58% |
| mean | 2.42ms | 6.73ms | -4.31ms | -64.01% |
| min | 1.93ms | 3.07ms | -1.13ms | -37.02% |
| max | 3.23ms | 12.52ms | -9.29ms | -74.19% |
| total | 48.45ms | 134.62ms | -86.16ms | -64.01% |

### spec_to_test_batch (5 consecutive runSpecToTest)

# Perf Report — spec_to_test_batch (5 consecutive runSpecToTest).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.40ms |
| p50 | 0.45ms |
| p95 | 0.66ms |
| p99 | 0.73ms |
| mean | 0.47ms |
| stdev | 0.09ms |
| min | 0.38ms |
| max | 0.75ms |
| total | 9.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.40ms | 0.51ms | -0.11ms | -21.50% |
| p50 | 0.45ms | 0.57ms | -0.12ms | -20.53% |
| p95 | 0.66ms | 1.16ms | -0.50ms | -43.05% |
| p99 | 0.73ms | 1.27ms | -0.54ms | -42.36% |
| mean | 0.47ms | 0.63ms | -0.16ms | -25.09% |
| min | 0.38ms | 0.45ms | -0.07ms | -15.76% |
| max | 0.75ms | 1.30ms | -0.55ms | -42.21% |
| total | 9.43ms | 12.59ms | -3.16ms | -25.09% |

### init_error_handling (3 InitConflictError catch)

# Perf Report — init_error_handling (3 InitConflictError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.74ms |
| p50 | 0.85ms |
| p95 | 0.93ms |
| p99 | 0.94ms |
| mean | 0.83ms |
| stdev | 0.09ms |
| min | 0.59ms |
| max | 0.94ms |
| total | 16.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.74ms | 0.83ms | -0.09ms | -10.82% |
| p50 | 0.85ms | 1.06ms | -0.22ms | -20.51% |
| p95 | 0.93ms | 1.69ms | -0.75ms | -44.64% |
| p99 | 0.94ms | 1.72ms | -0.78ms | -45.43% |
| mean | 0.83ms | 1.13ms | -0.29ms | -25.93% |
| min | 0.59ms | 0.77ms | -0.18ms | -22.98% |
| max | 0.94ms | 1.72ms | -0.79ms | -45.62% |
| total | 16.70ms | 22.54ms | -5.84ms | -25.93% |

