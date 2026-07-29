# Perf Suite — orm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | 0.31ms | 0.60ms | 200ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| query_workload (100 insert + 100 select) | 0.40ms | 0.77ms | 200ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| crud_cycle (10 rows × insert+update+delete) | 0.42ms | 1.34ms | 200ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| bulk_insert (setup + 100 insert) | 1.31ms | 400ms | PASS |
| query_workload (100 insert + 100 select) | 1.42ms | 400ms | PASS |
| crud_cycle (10 rows × insert+update+delete) | 1.23ms | 400ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | -53408 B | 3 B | 102400 B | yes | PASS |
| query_workload (100 insert + 100 select) | -7888 B | 32859 B | 102400 B | yes | PASS |
| crud_cycle (10 rows × insert+update+delete) | -35240 B | -7 B | 102400 B | yes | PASS |

## Detailed serial reports

### bulk_insert (setup + 100 insert)

# Perf Report — bulk_insert (setup + 100 insert).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.31ms |
| p50 | 0.42ms |
| p95 | 0.60ms |
| p99 | 0.72ms |
| mean | 0.44ms |
| stdev | 0.12ms |
| min | 0.28ms |
| max | 0.75ms |
| total | 6.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.31ms | 1.77ms | -1.46ms | -82.30% |
| p50 | 0.42ms | 3.78ms | -3.36ms | -88.95% |
| p95 | 0.60ms | 18.39ms | -17.79ms | -96.75% |
| p99 | 0.72ms | 19.86ms | -19.14ms | -96.39% |
| mean | 0.44ms | 7.28ms | -6.85ms | -94.02% |
| min | 0.28ms | 1.26ms | -0.98ms | -77.43% |
| max | 0.75ms | 20.23ms | -19.48ms | -96.30% |
| total | 6.53ms | 109.26ms | -102.73ms | -94.02% |

### query_workload (100 insert + 100 select)

# Perf Report — query_workload (100 insert + 100 select).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.40ms |
| p50 | 0.46ms |
| p95 | 0.77ms |
| p99 | 0.80ms |
| mean | 0.52ms |
| stdev | 0.13ms |
| min | 0.38ms |
| max | 0.81ms |
| total | 7.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.40ms | 0.89ms | -0.49ms | -55.25% |
| p50 | 0.46ms | 1.89ms | -1.42ms | -75.53% |
| p95 | 0.77ms | 34.70ms | -33.93ms | -97.78% |
| p99 | 0.80ms | 72.05ms | -71.25ms | -98.89% |
| mean | 0.52ms | 9.00ms | -8.49ms | -94.28% |
| min | 0.38ms | 0.71ms | -0.33ms | -46.95% |
| max | 0.81ms | 81.39ms | -80.58ms | -99.01% |
| total | 7.73ms | 135.07ms | -127.35ms | -94.28% |

### crud_cycle (10 rows × insert+update+delete)

# Perf Report — crud_cycle (10 rows × insert+update+delete).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.42ms |
| p50 | 0.67ms |
| p95 | 1.34ms |
| p99 | 1.67ms |
| mean | 0.74ms |
| stdev | 0.38ms |
| min | 0.37ms |
| max | 1.75ms |
| total | 11.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.42ms | 1.53ms | -1.11ms | -72.78% |
| p50 | 0.67ms | 3.90ms | -3.23ms | -82.86% |
| p95 | 1.34ms | 10.61ms | -9.28ms | -87.42% |
| p99 | 1.67ms | 16.78ms | -15.11ms | -90.07% |
| mean | 0.74ms | 4.45ms | -3.72ms | -83.47% |
| min | 0.37ms | 1.34ms | -0.97ms | -72.57% |
| max | 1.75ms | 18.32ms | -16.57ms | -90.46% |
| total | 11.04ms | 66.80ms | -55.76ms | -83.47% |

