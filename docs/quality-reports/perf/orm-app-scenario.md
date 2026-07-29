# Perf Suite — orm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | 1.36ms | 3.88ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| query_workload (100 insert + 100 select) | 0.41ms | 1.84ms | 200ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| crud_cycle (10 rows × insert+update+delete) | 0.66ms | 10.73ms | 200ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| bulk_insert (setup + 100 insert) | 17.74ms | 400ms | PASS |
| query_workload (100 insert + 100 select) | 1.22ms | 400ms | PASS |
| crud_cycle (10 rows × insert+update+delete) | 1.25ms | 400ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | -54680 B | 1 B | 102400 B | yes | PASS |
| query_workload (100 insert + 100 select) | -6720 B | 32845 B | 102400 B | yes | PASS |
| crud_cycle (10 rows × insert+update+delete) | -34808 B | -67318 B | 102400 B | yes | PASS |

## Detailed serial reports

### bulk_insert (setup + 100 insert)

# Perf Report — bulk_insert (setup + 100 insert).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 1.36ms |
| p50 | 1.92ms |
| p95 | 3.88ms |
| p99 | 5.18ms |
| mean | 2.32ms |
| stdev | 1.07ms |
| min | 1.13ms |
| max | 5.50ms |
| total | 34.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.36ms | 1.77ms | -0.41ms | -23.34% |
| p50 | 1.92ms | 3.78ms | -1.86ms | -49.24% |
| p95 | 3.88ms | 18.39ms | -14.51ms | -78.90% |
| p99 | 5.18ms | 19.86ms | -14.68ms | -73.93% |
| mean | 2.32ms | 7.28ms | -4.97ms | -68.16% |
| min | 1.13ms | 1.26ms | -0.13ms | -10.47% |
| max | 5.50ms | 20.23ms | -14.73ms | -72.80% |
| total | 34.78ms | 109.26ms | -74.48ms | -68.16% |

### query_workload (100 insert + 100 select)

# Perf Report — query_workload (100 insert + 100 select).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.41ms |
| p50 | 0.85ms |
| p95 | 1.84ms |
| p99 | 2.54ms |
| mean | 0.97ms |
| stdev | 0.61ms |
| min | 0.36ms |
| max | 2.72ms |
| total | 14.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.41ms | 0.89ms | -0.47ms | -53.50% |
| p50 | 0.85ms | 1.89ms | -1.04ms | -55.10% |
| p95 | 1.84ms | 34.70ms | -32.85ms | -94.69% |
| p99 | 2.54ms | 72.05ms | -69.51ms | -96.47% |
| mean | 0.97ms | 9.00ms | -8.03ms | -89.18% |
| min | 0.36ms | 0.71ms | -0.35ms | -48.73% |
| max | 2.72ms | 81.39ms | -78.67ms | -96.66% |
| total | 14.61ms | 135.07ms | -120.46ms | -89.18% |

### crud_cycle (10 rows × insert+update+delete)

# Perf Report — crud_cycle (10 rows × insert+update+delete).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.66ms |
| p50 | 2.43ms |
| p95 | 10.73ms |
| p99 | 11.30ms |
| mean | 3.09ms |
| stdev | 3.32ms |
| min | 0.56ms |
| max | 11.44ms |
| total | 46.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.66ms | 1.53ms | -0.87ms | -57.01% |
| p50 | 2.43ms | 3.90ms | -1.48ms | -37.85% |
| p95 | 10.73ms | 10.61ms | +0.11ms | +1.08% |
| p99 | 11.30ms | 16.78ms | -5.48ms | -32.65% |
| mean | 3.09ms | 4.45ms | -1.36ms | -30.51% |
| min | 0.56ms | 1.34ms | -0.78ms | -58.41% |
| max | 11.44ms | 18.32ms | -6.88ms | -37.53% |
| total | 46.42ms | 66.80ms | -20.38ms | -30.51% |

