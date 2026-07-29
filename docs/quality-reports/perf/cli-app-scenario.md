# Perf Suite — cli-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限はこの 2 倍 = 0.00050ms。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | gate | regression |
|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 1.83ms | 3.46ms | 500ms | PASS | improved — gate 無効 (regressionGate=false) |
| spec_to_test_batch (5 consecutive runSpecToTest) | 0.50ms | 1.00ms | 300ms | PASS | stable — gate 無効 (regressionGate=false) |
| init_error_handling (3 InitConflictError catch) | 0.83ms | 1.43ms | 500ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 11.76ms | 1000ms | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | 3.15ms | 600ms | PASS |
| init_error_handling (3 InitConflictError catch) | 4.56ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 5976 B | 0 B | 102400 B | yes | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | -1624 B | 0 B | 102400 B | yes | PASS |
| init_error_handling (3 InitConflictError catch) | 5320 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### init_workflow (3 fresh project scaffold)

# Perf Report — init_workflow (3 fresh project scaffold).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 1.83ms |
| p50 | 2.53ms |
| p95 | 3.46ms |
| p99 | 3.73ms |
| mean | 2.62ms |
| stdev | 0.57ms |
| min | 1.56ms |
| max | 3.80ms |
| total | 52.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.83ms | 3.53ms | -1.70ms | -48.11% |
| p50 | 2.53ms | 5.63ms | -3.10ms | -55.06% |
| p95 | 3.46ms | 12.29ms | -8.84ms | -71.87% |
| p99 | 3.73ms | 12.47ms | -8.74ms | -70.08% |
| mean | 2.62ms | 6.73ms | -4.12ms | -61.14% |
| min | 1.56ms | 3.07ms | -1.50ms | -49.07% |
| max | 3.80ms | 12.52ms | -8.72ms | -69.63% |
| total | 52.32ms | 134.62ms | -82.30ms | -61.14% |

### spec_to_test_batch (5 consecutive runSpecToTest)

# Perf Report — spec_to_test_batch (5 consecutive runSpecToTest).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.50ms |
| p50 | 0.53ms |
| p95 | 1.00ms |
| p99 | 2.81ms |
| mean | 0.70ms |
| stdev | 0.61ms |
| min | 0.48ms |
| max | 3.27ms |
| total | 13.99ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.50ms | 0.51ms | -0.01ms | -2.33% |
| p50 | 0.53ms | 0.57ms | -0.05ms | -8.03% |
| p95 | 1.00ms | 1.16ms | -0.16ms | -14.01% |
| p99 | 2.81ms | 1.27ms | +1.54ms | +121.10% |
| mean | 0.70ms | 0.63ms | +0.07ms | +11.15% |
| min | 0.48ms | 0.45ms | +0.02ms | +4.89% |
| max | 3.27ms | 1.30ms | +1.97ms | +151.18% |
| total | 13.99ms | 12.59ms | +1.40ms | +11.15% |

### init_error_handling (3 InitConflictError catch)

# Perf Report — init_error_handling (3 InitConflictError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.83ms |
| p50 | 0.99ms |
| p95 | 1.43ms |
| p99 | 1.83ms |
| mean | 1.05ms |
| stdev | 0.26ms |
| min | 0.81ms |
| max | 1.94ms |
| total | 21.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.83ms | 0.83ms | -0.00084ms | -0.10% |
| p50 | 0.99ms | 1.06ms | -0.07ms | -6.57% |
| p95 | 1.43ms | 1.69ms | -0.26ms | -15.18% |
| p99 | 1.83ms | 1.72ms | +0.12ms | +6.92% |
| mean | 1.05ms | 1.13ms | -0.07ms | -6.63% |
| min | 0.81ms | 0.77ms | +0.04ms | +5.35% |
| max | 1.94ms | 1.72ms | +0.21ms | +12.32% |
| total | 21.04ms | 22.54ms | -1.49ms | -6.63% |

