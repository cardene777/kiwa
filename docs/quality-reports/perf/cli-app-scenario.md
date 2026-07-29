# Perf Suite — cli-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 1.97ms | 2.83ms | 500ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| spec_to_test_batch (5 consecutive runSpecToTest) | 0.40ms | 0.47ms | 300ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| init_error_handling (3 InitConflictError catch) | 0.67ms | 0.90ms | 500ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 11.25ms | 1000ms | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | 1.83ms | 600ms | PASS |
| init_error_handling (3 InitConflictError catch) | 3.35ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 9288 B | 0 B | 102400 B | yes | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | -1704 B | 0 B | 102400 B | yes | PASS |
| init_error_handling (3 InitConflictError catch) | 5320 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### init_workflow (3 fresh project scaffold)

# Perf Report — init_workflow (3 fresh project scaffold).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 1.97ms |
| p50 | 2.23ms |
| p95 | 2.83ms |
| p99 | 2.95ms |
| mean | 2.29ms |
| stdev | 0.29ms |
| min | 1.91ms |
| max | 2.98ms |
| total | 45.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.97ms | 3.53ms | -1.57ms | -44.33% |
| p50 | 2.23ms | 5.63ms | -3.41ms | -60.48% |
| p95 | 2.83ms | 12.29ms | -9.47ms | -77.02% |
| p99 | 2.95ms | 12.47ms | -9.52ms | -76.34% |
| mean | 2.29ms | 6.73ms | -4.44ms | -66.00% |
| min | 1.91ms | 3.07ms | -1.15ms | -37.54% |
| max | 2.98ms | 12.52ms | -9.54ms | -76.17% |
| total | 45.77ms | 134.62ms | -88.85ms | -66.00% |

### spec_to_test_batch (5 consecutive runSpecToTest)

# Perf Report — spec_to_test_batch (5 consecutive runSpecToTest).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.40ms |
| p50 | 0.41ms |
| p95 | 0.47ms |
| p99 | 0.57ms |
| mean | 0.42ms |
| stdev | 0.04ms |
| min | 0.39ms |
| max | 0.59ms |
| total | 8.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.40ms | 0.51ms | -0.11ms | -22.27% |
| p50 | 0.41ms | 0.57ms | -0.16ms | -27.59% |
| p95 | 0.47ms | 1.16ms | -0.69ms | -59.77% |
| p99 | 0.57ms | 1.27ms | -0.70ms | -55.28% |
| mean | 0.42ms | 0.63ms | -0.21ms | -32.68% |
| min | 0.39ms | 0.45ms | -0.06ms | -13.56% |
| max | 0.59ms | 1.30ms | -0.71ms | -54.28% |
| total | 8.47ms | 12.59ms | -4.11ms | -32.68% |

### init_error_handling (3 InitConflictError catch)

# Perf Report — init_error_handling (3 InitConflictError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.67ms |
| p50 | 0.74ms |
| p95 | 0.90ms |
| p99 | 0.94ms |
| mean | 0.76ms |
| stdev | 0.09ms |
| min | 0.63ms |
| max | 0.95ms |
| total | 15.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.67ms | 0.83ms | -0.16ms | -19.64% |
| p50 | 0.74ms | 1.06ms | -0.32ms | -30.23% |
| p95 | 0.90ms | 1.69ms | -0.79ms | -46.82% |
| p99 | 0.94ms | 1.72ms | -0.78ms | -45.35% |
| mean | 0.76ms | 1.13ms | -0.36ms | -32.38% |
| min | 0.63ms | 0.77ms | -0.14ms | -18.74% |
| max | 0.95ms | 1.72ms | -0.78ms | -44.99% |
| total | 15.24ms | 22.54ms | -7.30ms | -32.38% |

