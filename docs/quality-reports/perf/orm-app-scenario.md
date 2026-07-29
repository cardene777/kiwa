# Perf Suite — orm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | 0.30ms | 0.42ms | 200ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| query_workload (100 insert + 100 select) | 0.30ms | 0.36ms | 200ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| crud_cycle (10 rows × insert+update+delete) | 0.20ms | 0.37ms | 200ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| bulk_insert (setup + 100 insert) | 0.95ms | 400ms | PASS |
| query_workload (100 insert + 100 select) | 0.96ms | 400ms | PASS |
| crud_cycle (10 rows × insert+update+delete) | 1.06ms | 400ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | -53704 B | 1 B | 102400 B | yes | PASS |
| query_workload (100 insert + 100 select) | -6560 B | -3 B | 102400 B | yes | PASS |
| crud_cycle (10 rows × insert+update+delete) | -34776 B | 3 B | 102400 B | yes | PASS |

## Detailed serial reports

### bulk_insert (setup + 100 insert)

# Perf Report — bulk_insert (setup + 100 insert).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.30ms |
| p50 | 0.34ms |
| p95 | 0.42ms |
| p99 | 0.45ms |
| mean | 0.35ms |
| stdev | 0.05ms |
| min | 0.28ms |
| max | 0.45ms |
| total | 5.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.30ms | 1.77ms | -1.47ms | -83.09% |
| p50 | 0.34ms | 3.78ms | -3.44ms | -90.94% |
| p95 | 0.42ms | 18.39ms | -17.97ms | -97.71% |
| p99 | 0.45ms | 19.86ms | -19.41ms | -97.75% |
| mean | 0.35ms | 7.28ms | -6.93ms | -95.18% |
| min | 0.28ms | 1.26ms | -0.98ms | -78.01% |
| max | 0.45ms | 20.23ms | -19.78ms | -97.76% |
| total | 5.27ms | 109.26ms | -103.99ms | -95.18% |

### query_workload (100 insert + 100 select)

# Perf Report — query_workload (100 insert + 100 select).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.30ms |
| p50 | 0.31ms |
| p95 | 0.36ms |
| p99 | 0.38ms |
| mean | 0.32ms |
| stdev | 0.03ms |
| min | 0.29ms |
| max | 0.38ms |
| total | 4.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.30ms | 0.89ms | -0.59ms | -66.06% |
| p50 | 0.31ms | 1.89ms | -1.57ms | -83.40% |
| p95 | 0.36ms | 34.70ms | -34.33ms | -98.95% |
| p99 | 0.38ms | 72.05ms | -71.67ms | -99.48% |
| mean | 0.32ms | 9.00ms | -8.68ms | -96.41% |
| min | 0.29ms | 0.71ms | -0.42ms | -59.18% |
| max | 0.38ms | 81.39ms | -81.01ms | -99.53% |
| total | 4.86ms | 135.07ms | -130.22ms | -96.41% |

### crud_cycle (10 rows × insert+update+delete)

# Perf Report — crud_cycle (10 rows × insert+update+delete).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.20ms |
| p50 | 0.27ms |
| p95 | 0.37ms |
| p99 | 0.38ms |
| mean | 0.27ms |
| stdev | 0.06ms |
| min | 0.20ms |
| max | 0.38ms |
| total | 4.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.20ms | 1.53ms | -1.32ms | -86.81% |
| p50 | 0.27ms | 3.90ms | -3.63ms | -93.03% |
| p95 | 0.37ms | 10.61ms | -10.24ms | -96.49% |
| p99 | 0.38ms | 16.78ms | -16.40ms | -97.74% |
| mean | 0.27ms | 4.45ms | -4.18ms | -93.93% |
| min | 0.20ms | 1.34ms | -1.14ms | -85.37% |
| max | 0.38ms | 18.32ms | -17.94ms | -97.92% |
| total | 4.06ms | 66.80ms | -62.75ms | -93.93% |

