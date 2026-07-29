# Perf Suite — orm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | 0.36ms | 0.52ms | 200ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| query_workload (100 insert + 100 select) | 0.37ms | 0.46ms | 200ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| crud_cycle (10 rows × insert+update+delete) | 0.23ms | 0.39ms | 200ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| bulk_insert (setup + 100 insert) | 1.69ms | 400ms | PASS |
| query_workload (100 insert + 100 select) | 1.10ms | 400ms | PASS |
| crud_cycle (10 rows × insert+update+delete) | 0.73ms | 400ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | -53608 B | -4 B | 102400 B | yes | PASS |
| query_workload (100 insert + 100 select) | -6432 B | 1 B | 102400 B | yes | PASS |
| crud_cycle (10 rows × insert+update+delete) | -35336 B | 4 B | 102400 B | yes | PASS |

## Detailed serial reports

### bulk_insert (setup + 100 insert)

# Perf Report — bulk_insert (setup + 100 insert).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.36ms |
| p50 | 0.43ms |
| p95 | 0.52ms |
| p99 | 0.52ms |
| mean | 0.43ms |
| stdev | 0.05ms |
| min | 0.35ms |
| max | 0.52ms |
| total | 6.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.36ms | 1.77ms | -1.41ms | -79.51% |
| p50 | 0.43ms | 3.78ms | -3.35ms | -88.74% |
| p95 | 0.52ms | 18.39ms | -17.87ms | -97.18% |
| p99 | 0.52ms | 19.86ms | -19.34ms | -97.36% |
| mean | 0.43ms | 7.28ms | -6.85ms | -94.06% |
| min | 0.35ms | 1.26ms | -0.91ms | -71.94% |
| max | 0.52ms | 20.23ms | -19.71ms | -97.41% |
| total | 6.49ms | 109.26ms | -102.77ms | -94.06% |

### query_workload (100 insert + 100 select)

# Perf Report — query_workload (100 insert + 100 select).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.37ms |
| p50 | 0.41ms |
| p95 | 0.46ms |
| p99 | 0.47ms |
| mean | 0.41ms |
| stdev | 0.03ms |
| min | 0.35ms |
| max | 0.47ms |
| total | 6.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.37ms | 0.89ms | -0.52ms | -58.18% |
| p50 | 0.41ms | 1.89ms | -1.48ms | -78.20% |
| p95 | 0.46ms | 34.70ms | -34.24ms | -98.68% |
| p99 | 0.47ms | 72.05ms | -71.58ms | -99.35% |
| mean | 0.41ms | 9.00ms | -8.59ms | -95.39% |
| min | 0.35ms | 0.71ms | -0.36ms | -50.14% |
| max | 0.47ms | 81.39ms | -80.91ms | -99.42% |
| total | 6.22ms | 135.07ms | -128.85ms | -95.39% |

### crud_cycle (10 rows × insert+update+delete)

# Perf Report — crud_cycle (10 rows × insert+update+delete).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.23ms |
| p50 | 0.29ms |
| p95 | 0.39ms |
| p99 | 0.41ms |
| mean | 0.30ms |
| stdev | 0.06ms |
| min | 0.22ms |
| max | 0.42ms |
| total | 4.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.23ms | 1.53ms | -1.29ms | -84.66% |
| p50 | 0.29ms | 3.90ms | -3.61ms | -92.60% |
| p95 | 0.39ms | 10.61ms | -10.23ms | -96.37% |
| p99 | 0.41ms | 16.78ms | -16.37ms | -97.54% |
| mean | 0.30ms | 4.45ms | -4.15ms | -93.24% |
| min | 0.22ms | 1.34ms | -1.12ms | -83.51% |
| max | 0.42ms | 18.32ms | -17.90ms | -97.71% |
| total | 4.52ms | 66.80ms | -62.29ms | -93.24% |

