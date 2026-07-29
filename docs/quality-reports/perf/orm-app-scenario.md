# Perf Suite — orm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | 0.28ms | 0.40ms | 200ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| query_workload (100 insert + 100 select) | 0.31ms | 0.46ms | 200ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| crud_cycle (10 rows × insert+update+delete) | 0.25ms | 0.36ms | 200ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| bulk_insert (setup + 100 insert) | 0.85ms | 400ms | PASS |
| query_workload (100 insert + 100 select) | 1.20ms | 400ms | PASS |
| crud_cycle (10 rows × insert+update+delete) | 0.92ms | 400ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | -53656 B | 3 B | 102400 B | yes | PASS |
| query_workload (100 insert + 100 select) | -6432 B | 1 B | 102400 B | yes | PASS |
| crud_cycle (10 rows × insert+update+delete) | -35368 B | 3 B | 102400 B | yes | PASS |

## Detailed serial reports

### bulk_insert (setup + 100 insert)

# Perf Report — bulk_insert (setup + 100 insert).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.28ms |
| p50 | 0.33ms |
| p95 | 0.40ms |
| p99 | 0.40ms |
| mean | 0.33ms |
| stdev | 0.05ms |
| min | 0.27ms |
| max | 0.40ms |
| total | 4.97ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.28ms | 1.77ms | -1.50ms | -84.41% |
| p50 | 0.33ms | 3.78ms | -3.45ms | -91.21% |
| p95 | 0.40ms | 18.39ms | -17.98ms | -97.82% |
| p99 | 0.40ms | 19.86ms | -19.46ms | -97.97% |
| mean | 0.33ms | 7.28ms | -6.95ms | -95.45% |
| min | 0.27ms | 1.26ms | -0.99ms | -78.89% |
| max | 0.40ms | 20.23ms | -19.83ms | -98.00% |
| total | 4.97ms | 109.26ms | -104.29ms | -95.45% |

### query_workload (100 insert + 100 select)

# Perf Report — query_workload (100 insert + 100 select).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.31ms |
| p50 | 0.37ms |
| p95 | 0.46ms |
| p99 | 0.50ms |
| mean | 0.38ms |
| stdev | 0.06ms |
| min | 0.29ms |
| max | 0.51ms |
| total | 5.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.31ms | 0.89ms | -0.58ms | -64.97% |
| p50 | 0.37ms | 1.89ms | -1.52ms | -80.58% |
| p95 | 0.46ms | 34.70ms | -34.23ms | -98.66% |
| p99 | 0.50ms | 72.05ms | -71.55ms | -99.30% |
| mean | 0.38ms | 9.00ms | -8.63ms | -95.80% |
| min | 0.29ms | 0.71ms | -0.42ms | -59.24% |
| max | 0.51ms | 81.39ms | -80.88ms | -99.37% |
| total | 5.67ms | 135.07ms | -129.40ms | -95.80% |

### crud_cycle (10 rows × insert+update+delete)

# Perf Report — crud_cycle (10 rows × insert+update+delete).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.25ms |
| p50 | 0.29ms |
| p95 | 0.36ms |
| p99 | 0.36ms |
| mean | 0.30ms |
| stdev | 0.04ms |
| min | 0.24ms |
| max | 0.36ms |
| total | 4.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.25ms | 1.53ms | -1.28ms | -83.67% |
| p50 | 0.29ms | 3.90ms | -3.62ms | -92.66% |
| p95 | 0.36ms | 10.61ms | -10.25ms | -96.61% |
| p99 | 0.36ms | 16.78ms | -16.42ms | -97.85% |
| mean | 0.30ms | 4.45ms | -4.15ms | -93.27% |
| min | 0.24ms | 1.34ms | -1.10ms | -82.29% |
| max | 0.36ms | 18.32ms | -17.96ms | -98.03% |
| total | 4.50ms | 66.80ms | -62.31ms | -93.27% |

