# Perf Suite — orm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | 0.34ms | 0.56ms | 200ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| query_workload (100 insert + 100 select) | 0.33ms | 0.45ms | 200ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| crud_cycle (10 rows × insert+update+delete) | 0.29ms | 0.45ms | 200ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| bulk_insert (setup + 100 insert) | 0.92ms | 400ms | PASS |
| query_workload (100 insert + 100 select) | 1.11ms | 400ms | PASS |
| crud_cycle (10 rows × insert+update+delete) | 1.01ms | 400ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | -53816 B | 3 B | 102400 B | yes | PASS |
| query_workload (100 insert + 100 select) | -6432 B | 0 B | 102400 B | yes | PASS |
| crud_cycle (10 rows × insert+update+delete) | -34776 B | 3 B | 102400 B | yes | PASS |

## Detailed serial reports

### bulk_insert (setup + 100 insert)

# Perf Report — bulk_insert (setup + 100 insert).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.34ms |
| p50 | 0.39ms |
| p95 | 0.56ms |
| p99 | 0.62ms |
| mean | 0.42ms |
| stdev | 0.09ms |
| min | 0.31ms |
| max | 0.63ms |
| total | 6.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.34ms | 1.77ms | -1.43ms | -80.92% |
| p50 | 0.39ms | 3.78ms | -3.39ms | -89.60% |
| p95 | 0.56ms | 18.39ms | -17.82ms | -96.93% |
| p99 | 0.62ms | 19.86ms | -19.24ms | -96.89% |
| mean | 0.42ms | 7.28ms | -6.86ms | -94.19% |
| min | 0.31ms | 1.26ms | -0.95ms | -75.17% |
| max | 0.63ms | 20.23ms | -19.60ms | -96.88% |
| total | 6.35ms | 109.26ms | -102.91ms | -94.19% |

### query_workload (100 insert + 100 select)

# Perf Report — query_workload (100 insert + 100 select).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.33ms |
| p50 | 0.36ms |
| p95 | 0.45ms |
| p99 | 0.49ms |
| mean | 0.38ms |
| stdev | 0.05ms |
| min | 0.31ms |
| max | 0.50ms |
| total | 5.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.33ms | 0.89ms | -0.55ms | -62.38% |
| p50 | 0.36ms | 1.89ms | -1.53ms | -81.12% |
| p95 | 0.45ms | 34.70ms | -34.24ms | -98.70% |
| p99 | 0.49ms | 72.05ms | -71.56ms | -99.32% |
| mean | 0.38ms | 9.00ms | -8.63ms | -95.81% |
| min | 0.31ms | 0.71ms | -0.40ms | -56.39% |
| max | 0.50ms | 81.39ms | -80.89ms | -99.38% |
| total | 5.66ms | 135.07ms | -129.41ms | -95.81% |

### crud_cycle (10 rows × insert+update+delete)

# Perf Report — crud_cycle (10 rows × insert+update+delete).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.29ms |
| p50 | 0.35ms |
| p95 | 0.45ms |
| p99 | 0.53ms |
| mean | 0.35ms |
| stdev | 0.07ms |
| min | 0.28ms |
| max | 0.55ms |
| total | 5.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.29ms | 1.53ms | -1.23ms | -80.82% |
| p50 | 0.35ms | 3.90ms | -3.55ms | -91.09% |
| p95 | 0.45ms | 10.61ms | -10.16ms | -95.75% |
| p99 | 0.53ms | 16.78ms | -16.25ms | -96.86% |
| mean | 0.35ms | 4.45ms | -4.10ms | -92.04% |
| min | 0.28ms | 1.34ms | -1.07ms | -79.46% |
| max | 0.55ms | 18.32ms | -17.77ms | -97.02% |
| total | 5.31ms | 66.80ms | -61.49ms | -92.04% |

