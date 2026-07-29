# Perf Suite — orm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00058ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | 0.35ms | 0.50ms | 200ms | 0.00058ms | PASS | improved — gate 無効 (regressionGate=false) |
| query_workload (100 insert + 100 select) | 0.31ms | 0.57ms | 200ms | 0.00058ms | PASS | improved — gate 無効 (regressionGate=false) |
| crud_cycle (10 rows × insert+update+delete) | 0.33ms | 0.98ms | 200ms | 0.00058ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| bulk_insert (setup + 100 insert) | 1.04ms | 400ms | PASS |
| query_workload (100 insert + 100 select) | 1.62ms | 400ms | PASS |
| crud_cycle (10 rows × insert+update+delete) | 0.88ms | 400ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | -54536 B | 0 B | 102400 B | yes | PASS |
| query_workload (100 insert + 100 select) | -7568 B | -3 B | 102400 B | yes | PASS |
| crud_cycle (10 rows × insert+update+delete) | -36024 B | 6 B | 102400 B | yes | PASS |

## Detailed serial reports

### bulk_insert (setup + 100 insert)

# Perf Report — bulk_insert (setup + 100 insert).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.35ms |
| p50 | 0.39ms |
| p95 | 0.50ms |
| p99 | 0.52ms |
| mean | 0.41ms |
| stdev | 0.06ms |
| min | 0.35ms |
| max | 0.53ms |
| total | 6.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.35ms | 1.77ms | -1.42ms | -80.31% |
| p50 | 0.39ms | 3.78ms | -3.39ms | -89.69% |
| p95 | 0.50ms | 18.39ms | -17.89ms | -97.28% |
| p99 | 0.52ms | 19.86ms | -19.34ms | -97.38% |
| mean | 0.41ms | 7.28ms | -6.87ms | -94.33% |
| min | 0.35ms | 1.26ms | -0.91ms | -72.55% |
| max | 0.53ms | 20.23ms | -19.70ms | -97.40% |
| total | 6.19ms | 109.26ms | -103.07ms | -94.33% |

### query_workload (100 insert + 100 select)

# Perf Report — query_workload (100 insert + 100 select).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.31ms |
| p50 | 0.37ms |
| p95 | 0.57ms |
| p99 | 0.62ms |
| mean | 0.39ms |
| stdev | 0.09ms |
| min | 0.30ms |
| max | 0.63ms |
| total | 5.92ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.31ms | 0.89ms | -0.58ms | -65.35% |
| p50 | 0.37ms | 1.89ms | -1.51ms | -80.18% |
| p95 | 0.57ms | 34.70ms | -34.13ms | -98.37% |
| p99 | 0.62ms | 72.05ms | -71.43ms | -99.15% |
| mean | 0.39ms | 9.00ms | -8.61ms | -95.62% |
| min | 0.30ms | 0.71ms | -0.41ms | -57.50% |
| max | 0.63ms | 81.39ms | -80.76ms | -99.23% |
| total | 5.92ms | 135.07ms | -129.16ms | -95.62% |

### crud_cycle (10 rows × insert+update+delete)

# Perf Report — crud_cycle (10 rows × insert+update+delete).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.33ms |
| p50 | 0.39ms |
| p95 | 0.98ms |
| p99 | 1.14ms |
| mean | 0.50ms |
| stdev | 0.24ms |
| min | 0.30ms |
| max | 1.18ms |
| total | 7.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.33ms | 1.53ms | -1.19ms | -78.15% |
| p50 | 0.39ms | 3.90ms | -3.51ms | -89.91% |
| p95 | 0.98ms | 10.61ms | -9.64ms | -90.80% |
| p99 | 1.14ms | 16.78ms | -15.64ms | -93.22% |
| mean | 0.50ms | 4.45ms | -3.96ms | -88.84% |
| min | 0.30ms | 1.34ms | -1.04ms | -77.66% |
| max | 1.18ms | 18.32ms | -17.14ms | -93.57% |
| total | 7.46ms | 66.80ms | -59.35ms | -88.84% |

