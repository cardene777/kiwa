# Perf Suite — orm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | 1.33ms | 200ms | PASS | regressed |
| query_workload (100 insert + 100 select) | 0.86ms | 200ms | PASS | stable |
| crud_cycle (10 rows × insert+update+delete) | 1.13ms | 200ms | PASS | regressed |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| bulk_insert (setup + 100 insert) | 1.14ms | 400ms | PASS |
| query_workload (100 insert + 100 select) | 1.52ms | 400ms | PASS |
| crud_cycle (10 rows × insert+update+delete) | 1.06ms | 400ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | -49512 B | -1008 B | 102400 B | yes | PASS |
| query_workload (100 insert + 100 select) | -19816 B | -68378 B | 102400 B | yes | PASS |
| crud_cycle (10 rows × insert+update+delete) | -31200 B | -78878 B | 102400 B | yes | PASS |

## Detailed serial reports

### bulk_insert (setup + 100 insert)

# Perf Report — bulk_insert (setup + 100 insert).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.79ms |
| p95 | 1.33ms |
| p99 | 1.39ms |
| mean | 0.83ms |
| stdev | 0.28ms |
| min | 0.46ms |
| max | 1.40ms |
| total | 12.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.79ms | 0.38ms | +0.41ms | +108.20% |
| p95 | 1.33ms | 0.52ms | +0.81ms | +154.43% |
| p99 | 1.39ms | 0.54ms | +0.85ms | +158.90% |
| mean | 0.83ms | 0.38ms | +0.45ms | +118.49% |
| min | 0.46ms | 0.24ms | +0.22ms | +93.79% |
| max | 1.40ms | 0.54ms | +0.86ms | +159.98% |
| total | 12.49ms | 5.72ms | +6.77ms | +118.49% |

### query_workload (100 insert + 100 select)

# Perf Report — query_workload (100 insert + 100 select).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.57ms |
| p95 | 0.86ms |
| p99 | 0.98ms |
| mean | 0.62ms |
| stdev | 0.18ms |
| min | 0.39ms |
| max | 1.01ms |
| total | 9.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.57ms | 0.38ms | +0.19ms | +48.93% |
| p95 | 0.86ms | 0.63ms | +0.23ms | +36.73% |
| p99 | 0.98ms | 0.86ms | +0.12ms | +14.21% |
| mean | 0.62ms | 0.42ms | +0.20ms | +46.52% |
| min | 0.39ms | 0.32ms | +0.07ms | +21.49% |
| max | 1.01ms | 0.91ms | +0.09ms | +10.31% |
| total | 9.24ms | 6.31ms | +2.93ms | +46.52% |

### crud_cycle (10 rows × insert+update+delete)

# Perf Report — crud_cycle (10 rows × insert+update+delete).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.53ms |
| p95 | 1.13ms |
| p99 | 1.38ms |
| mean | 0.61ms |
| stdev | 0.29ms |
| min | 0.35ms |
| max | 1.44ms |
| total | 9.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.53ms | 0.30ms | +0.23ms | +77.76% |
| p95 | 1.13ms | 0.42ms | +0.71ms | +169.51% |
| p99 | 1.38ms | 0.42ms | +0.96ms | +226.23% |
| mean | 0.61ms | 0.30ms | +0.30ms | +100.86% |
| min | 0.35ms | 0.22ms | +0.13ms | +60.29% |
| max | 1.44ms | 0.42ms | +1.02ms | +240.21% |
| total | 9.09ms | 4.53ms | +4.56ms | +100.86% |

