# Perf Suite — orm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | 0.41ms | 200ms | PASS | improved |
| query_workload (100 insert + 100 select) | 0.89ms | 200ms | PASS | stable |
| crud_cycle (10 rows × insert+update+delete) | 0.40ms | 200ms | PASS | improved |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| bulk_insert (setup + 100 insert) | 1.07ms | 400ms | PASS |
| query_workload (100 insert + 100 select) | 1.02ms | 400ms | PASS |
| crud_cycle (10 rows × insert+update+delete) | 0.92ms | 400ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | 879848 B | 32846 B | 102400 B | PASS |
| query_workload (100 insert + 100 select) | 1025984 B | 32835 B | 102400 B | PASS |
| crud_cycle (10 rows × insert+update+delete) | 798088 B | 32851 B | 102400 B | PASS |

## Detailed serial reports

### bulk_insert (setup + 100 insert)

# Perf Report — bulk_insert (setup + 100 insert).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.33ms |
| p95 | 0.41ms |
| p99 | 0.41ms |
| mean | 0.33ms |
| stdev | 0.07ms |
| min | 0.23ms |
| max | 0.42ms |
| total | 4.88ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.33ms | 1.27ms | -0.94ms | -74.09% |
| p95 | 0.41ms | 2.12ms | -1.71ms | -80.60% |
| p99 | 0.41ms | 2.27ms | -1.85ms | -81.73% |
| mean | 0.33ms | 1.43ms | -1.10ms | -77.20% |
| min | 0.23ms | 0.65ms | -0.43ms | -65.44% |
| max | 0.42ms | 2.31ms | -1.89ms | -81.98% |
| total | 4.88ms | 21.40ms | -16.52ms | -77.20% |

### query_workload (100 insert + 100 select)

# Perf Report — query_workload (100 insert + 100 select).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.49ms |
| p95 | 0.89ms |
| p99 | 1.18ms |
| mean | 0.53ms |
| stdev | 0.23ms |
| min | 0.29ms |
| max | 1.25ms |
| total | 7.92ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.49ms | 0.72ms | -0.23ms | -32.26% |
| p95 | 0.89ms | 1.25ms | -0.36ms | -28.43% |
| p99 | 1.18ms | 1.32ms | -0.13ms | -10.17% |
| mean | 0.53ms | 0.81ms | -0.28ms | -34.44% |
| min | 0.29ms | 0.44ms | -0.15ms | -34.55% |
| max | 1.25ms | 1.33ms | -0.08ms | -5.89% |
| total | 7.92ms | 12.08ms | -4.16ms | -34.44% |

### crud_cycle (10 rows × insert+update+delete)

# Perf Report — crud_cycle (10 rows × insert+update+delete).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.24ms |
| p95 | 0.40ms |
| p99 | 0.40ms |
| mean | 0.27ms |
| stdev | 0.06ms |
| min | 0.22ms |
| max | 0.40ms |
| total | 4.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.24ms | 0.83ms | -0.59ms | -70.68% |
| p95 | 0.40ms | 1.45ms | -1.05ms | -72.32% |
| p99 | 0.40ms | 1.59ms | -1.19ms | -74.61% |
| mean | 0.27ms | 0.87ms | -0.60ms | -69.18% |
| min | 0.22ms | 0.36ms | -0.13ms | -37.26% |
| max | 0.40ms | 1.62ms | -1.22ms | -75.13% |
| total | 4.01ms | 13.00ms | -9.00ms | -69.18% |

