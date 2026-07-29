# Perf Suite — cli-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 2.07ms | 2.56ms | 500ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |
| spec_to_test_batch (5 consecutive runSpecToTest) | 0.38ms | 0.46ms | 300ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |
| init_error_handling (3 InitConflictError catch) | 0.62ms | 0.89ms | 500ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 8.89ms | 1000ms | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | 2.00ms | 600ms | PASS |
| init_error_handling (3 InitConflictError catch) | 3.65ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 7656 B | 0 B | 102400 B | yes | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | -1624 B | 0 B | 102400 B | yes | PASS |
| init_error_handling (3 InitConflictError catch) | 5320 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### init_workflow (3 fresh project scaffold)

# Perf Report — init_workflow (3 fresh project scaffold).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 2.07ms |
| p50 | 2.23ms |
| p95 | 2.56ms |
| p99 | 2.61ms |
| mean | 2.28ms |
| stdev | 0.19ms |
| min | 1.99ms |
| max | 2.62ms |
| total | 45.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 2.07ms | 3.53ms | -1.46ms | -41.48% |
| p50 | 2.23ms | 5.63ms | -3.41ms | -60.50% |
| p95 | 2.56ms | 12.29ms | -9.73ms | -79.16% |
| p99 | 2.61ms | 12.47ms | -9.86ms | -79.06% |
| mean | 2.28ms | 6.73ms | -4.45ms | -66.16% |
| min | 1.99ms | 3.07ms | -1.07ms | -34.99% |
| max | 2.62ms | 12.52ms | -9.89ms | -79.03% |
| total | 45.56ms | 134.62ms | -89.06ms | -66.16% |

### spec_to_test_batch (5 consecutive runSpecToTest)

# Perf Report — spec_to_test_batch (5 consecutive runSpecToTest).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.38ms |
| p50 | 0.40ms |
| p95 | 0.46ms |
| p99 | 0.62ms |
| mean | 0.41ms |
| stdev | 0.06ms |
| min | 0.38ms |
| max | 0.66ms |
| total | 8.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.38ms | 0.51ms | -0.13ms | -25.16% |
| p50 | 0.40ms | 0.57ms | -0.17ms | -29.46% |
| p95 | 0.46ms | 1.16ms | -0.70ms | -60.71% |
| p99 | 0.62ms | 1.27ms | -0.65ms | -51.35% |
| mean | 0.41ms | 0.63ms | -0.21ms | -34.13% |
| min | 0.38ms | 0.45ms | -0.08ms | -17.35% |
| max | 0.66ms | 1.30ms | -0.64ms | -49.27% |
| total | 8.29ms | 12.59ms | -4.30ms | -34.13% |

### init_error_handling (3 InitConflictError catch)

# Perf Report — init_error_handling (3 InitConflictError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.62ms |
| p50 | 0.65ms |
| p95 | 0.89ms |
| p99 | 0.98ms |
| mean | 0.69ms |
| stdev | 0.10ms |
| min | 0.59ms |
| max | 1.00ms |
| total | 13.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.62ms | 0.83ms | -0.21ms | -25.67% |
| p50 | 0.65ms | 1.06ms | -0.41ms | -38.61% |
| p95 | 0.89ms | 1.69ms | -0.79ms | -46.94% |
| p99 | 0.98ms | 1.72ms | -0.74ms | -42.85% |
| mean | 0.69ms | 1.13ms | -0.44ms | -38.78% |
| min | 0.59ms | 0.77ms | -0.18ms | -23.71% |
| max | 1.00ms | 1.72ms | -0.72ms | -41.85% |
| total | 13.80ms | 22.54ms | -8.74ms | -38.78% |

