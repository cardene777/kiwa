# Perf Suite — cli-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 2.03ms | 2.63ms | 500ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| spec_to_test_batch (5 consecutive runSpecToTest) | 0.40ms | 0.51ms | 300ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| init_error_handling (3 InitConflictError catch) | 0.67ms | 1.01ms | 500ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 11.95ms | 1000ms | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | 2.41ms | 600ms | PASS |
| init_error_handling (3 InitConflictError catch) | 3.31ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 10736 B | 0 B | 102400 B | yes | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | -1624 B | 0 B | 102400 B | yes | PASS |
| init_error_handling (3 InitConflictError catch) | 5352 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### init_workflow (3 fresh project scaffold)

# Perf Report — init_workflow (3 fresh project scaffold).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 2.03ms |
| p50 | 2.17ms |
| p95 | 2.63ms |
| p99 | 2.70ms |
| mean | 2.24ms |
| stdev | 0.22ms |
| min | 1.96ms |
| max | 2.71ms |
| total | 44.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 2.03ms | 3.53ms | -1.50ms | -42.49% |
| p50 | 2.17ms | 5.63ms | -3.47ms | -61.56% |
| p95 | 2.63ms | 12.29ms | -9.66ms | -78.57% |
| p99 | 2.70ms | 12.47ms | -9.77ms | -78.37% |
| mean | 2.24ms | 6.73ms | -4.49ms | -66.75% |
| min | 1.96ms | 3.07ms | -1.11ms | -36.06% |
| max | 2.71ms | 12.52ms | -9.80ms | -78.32% |
| total | 44.76ms | 134.62ms | -89.85ms | -66.75% |

### spec_to_test_batch (5 consecutive runSpecToTest)

# Perf Report — spec_to_test_batch (5 consecutive runSpecToTest).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.40ms |
| p50 | 0.43ms |
| p95 | 0.51ms |
| p99 | 0.73ms |
| mean | 0.45ms |
| stdev | 0.09ms |
| min | 0.39ms |
| max | 0.79ms |
| total | 8.99ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.40ms | 0.51ms | -0.11ms | -21.85% |
| p50 | 0.43ms | 0.57ms | -0.14ms | -24.43% |
| p95 | 0.51ms | 1.16ms | -0.65ms | -56.30% |
| p99 | 0.73ms | 1.27ms | -0.54ms | -42.59% |
| mean | 0.45ms | 0.63ms | -0.18ms | -28.61% |
| min | 0.39ms | 0.45ms | -0.07ms | -14.85% |
| max | 0.79ms | 1.30ms | -0.51ms | -39.54% |
| total | 8.99ms | 12.59ms | -3.60ms | -28.61% |

### init_error_handling (3 InitConflictError catch)

# Perf Report — init_error_handling (3 InitConflictError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.67ms |
| p50 | 0.74ms |
| p95 | 1.01ms |
| p99 | 1.13ms |
| mean | 0.78ms |
| stdev | 0.13ms |
| min | 0.62ms |
| max | 1.17ms |
| total | 15.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.67ms | 0.83ms | -0.17ms | -19.90% |
| p50 | 0.74ms | 1.06ms | -0.32ms | -30.46% |
| p95 | 1.01ms | 1.69ms | -0.68ms | -40.35% |
| p99 | 1.13ms | 1.72ms | -0.58ms | -33.88% |
| mean | 0.78ms | 1.13ms | -0.35ms | -30.79% |
| min | 0.62ms | 0.77ms | -0.15ms | -19.95% |
| max | 1.17ms | 1.72ms | -0.56ms | -32.30% |
| total | 15.60ms | 22.54ms | -6.94ms | -30.79% |

