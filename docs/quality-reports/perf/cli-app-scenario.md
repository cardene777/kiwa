# Perf Suite — cli-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 2.03ms | 2.53ms | 500ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| spec_to_test_batch (5 consecutive runSpecToTest) | 0.38ms | 0.54ms | 300ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| init_error_handling (3 InitConflictError catch) | 0.64ms | 0.89ms | 500ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 8.97ms | 1000ms | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | 2.00ms | 600ms | PASS |
| init_error_handling (3 InitConflictError catch) | 3.00ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 11224 B | 0 B | 102400 B | yes | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | -2184 B | 0 B | 102400 B | yes | PASS |
| init_error_handling (3 InitConflictError catch) | 4312 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### init_workflow (3 fresh project scaffold)

# Perf Report — init_workflow (3 fresh project scaffold).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 2.03ms |
| p50 | 2.26ms |
| p95 | 2.53ms |
| p99 | 2.59ms |
| mean | 2.28ms |
| stdev | 0.17ms |
| min | 1.99ms |
| max | 2.60ms |
| total | 45.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 2.03ms | 3.53ms | -1.50ms | -42.60% |
| p50 | 2.26ms | 5.63ms | -3.37ms | -59.89% |
| p95 | 2.53ms | 12.29ms | -9.76ms | -79.42% |
| p99 | 2.59ms | 12.47ms | -9.89ms | -79.27% |
| mean | 2.28ms | 6.73ms | -4.45ms | -66.18% |
| min | 1.99ms | 3.07ms | -1.08ms | -35.11% |
| max | 2.60ms | 12.52ms | -9.92ms | -79.23% |
| total | 45.52ms | 134.62ms | -89.09ms | -66.18% |

### spec_to_test_batch (5 consecutive runSpecToTest)

# Perf Report — spec_to_test_batch (5 consecutive runSpecToTest).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.38ms |
| p50 | 0.44ms |
| p95 | 0.54ms |
| p99 | 0.81ms |
| mean | 0.46ms |
| stdev | 0.11ms |
| min | 0.38ms |
| max | 0.87ms |
| total | 9.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.38ms | 0.51ms | -0.13ms | -25.17% |
| p50 | 0.44ms | 0.57ms | -0.13ms | -22.32% |
| p95 | 0.54ms | 1.16ms | -0.61ms | -53.02% |
| p99 | 0.81ms | 1.27ms | -0.47ms | -36.70% |
| mean | 0.46ms | 0.63ms | -0.17ms | -27.01% |
| min | 0.38ms | 0.45ms | -0.08ms | -16.81% |
| max | 0.87ms | 1.30ms | -0.43ms | -33.06% |
| total | 9.19ms | 12.59ms | -3.40ms | -27.01% |

### init_error_handling (3 InitConflictError catch)

# Perf Report — init_error_handling (3 InitConflictError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.64ms |
| p50 | 0.74ms |
| p95 | 0.89ms |
| p99 | 0.91ms |
| mean | 0.76ms |
| stdev | 0.09ms |
| min | 0.62ms |
| max | 0.92ms |
| total | 15.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.64ms | 0.83ms | -0.20ms | -23.84% |
| p50 | 0.74ms | 1.06ms | -0.33ms | -30.87% |
| p95 | 0.89ms | 1.69ms | -0.80ms | -47.23% |
| p99 | 0.91ms | 1.72ms | -0.80ms | -46.70% |
| mean | 0.76ms | 1.13ms | -0.37ms | -32.99% |
| min | 0.62ms | 0.77ms | -0.15ms | -20.10% |
| max | 0.92ms | 1.72ms | -0.80ms | -46.57% |
| total | 15.10ms | 22.54ms | -7.44ms | -32.99% |

