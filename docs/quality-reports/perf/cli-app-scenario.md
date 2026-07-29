# Perf Suite — cli-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 3.56ms | 11.55ms | 500ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| spec_to_test_batch (5 consecutive runSpecToTest) | 0.45ms | 0.86ms | 300ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| init_error_handling (3 InitConflictError catch) | 0.68ms | 1.11ms | 500ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 53.76ms | 1000ms | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | 2.29ms | 600ms | PASS |
| init_error_handling (3 InitConflictError catch) | 4.14ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 7344 B | 0 B | 102400 B | yes | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | -1624 B | 0 B | 102400 B | yes | PASS |
| init_error_handling (3 InitConflictError catch) | 5320 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### init_workflow (3 fresh project scaffold)

# Perf Report — init_workflow (3 fresh project scaffold).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 3.56ms |
| p50 | 5.25ms |
| p95 | 11.55ms |
| p99 | 18.91ms |
| mean | 6.59ms |
| stdev | 3.94ms |
| min | 2.98ms |
| max | 20.75ms |
| total | 131.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.56ms | 3.53ms | +0.03ms | +0.90% |
| p50 | 5.25ms | 5.63ms | -0.38ms | -6.78% |
| p95 | 11.55ms | 12.29ms | -0.74ms | -6.06% |
| p99 | 18.91ms | 12.47ms | +6.44ms | +51.63% |
| mean | 6.59ms | 6.73ms | -0.14ms | -2.05% |
| min | 2.98ms | 3.07ms | -0.08ms | -2.74% |
| max | 20.75ms | 12.52ms | +8.24ms | +65.80% |
| total | 131.85ms | 134.62ms | -2.77ms | -2.05% |

### spec_to_test_batch (5 consecutive runSpecToTest)

# Perf Report — spec_to_test_batch (5 consecutive runSpecToTest).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.45ms |
| p50 | 0.51ms |
| p95 | 0.86ms |
| p99 | 0.96ms |
| mean | 0.57ms |
| stdev | 0.15ms |
| min | 0.44ms |
| max | 0.98ms |
| total | 11.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.45ms | 0.51ms | -0.06ms | -12.04% |
| p50 | 0.51ms | 0.57ms | -0.06ms | -11.28% |
| p95 | 0.86ms | 1.16ms | -0.29ms | -25.34% |
| p99 | 0.96ms | 1.27ms | -0.31ms | -24.60% |
| mean | 0.57ms | 0.63ms | -0.06ms | -8.98% |
| min | 0.44ms | 0.45ms | -0.01ms | -3.10% |
| max | 0.98ms | 1.30ms | -0.32ms | -24.43% |
| total | 11.46ms | 12.59ms | -1.13ms | -8.98% |

### init_error_handling (3 InitConflictError catch)

# Perf Report — init_error_handling (3 InitConflictError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.68ms |
| p50 | 0.92ms |
| p95 | 1.11ms |
| p99 | 1.11ms |
| mean | 0.89ms |
| stdev | 0.16ms |
| min | 0.67ms |
| max | 1.12ms |
| total | 17.88ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.68ms | 0.83ms | -0.15ms | -18.03% |
| p50 | 0.92ms | 1.06ms | -0.14ms | -13.18% |
| p95 | 1.11ms | 1.69ms | -0.58ms | -34.19% |
| p99 | 1.11ms | 1.72ms | -0.60ms | -35.08% |
| mean | 0.89ms | 1.13ms | -0.23ms | -20.68% |
| min | 0.67ms | 0.77ms | -0.10ms | -12.56% |
| max | 1.12ms | 1.72ms | -0.61ms | -35.30% |
| total | 17.88ms | 22.54ms | -4.66ms | -20.68% |

