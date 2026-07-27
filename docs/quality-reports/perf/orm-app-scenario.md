# Perf Suite — orm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | 0.50ms | 200ms | PASS | stable |
| query_workload (100 insert + 100 select) | 0.39ms | 200ms | PASS | stable |
| crud_cycle (10 rows × insert+update+delete) | 0.36ms | 200ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| bulk_insert (setup + 100 insert) | 0.99ms | 400ms | PASS |
| query_workload (100 insert + 100 select) | 0.90ms | 400ms | PASS |
| crud_cycle (10 rows × insert+update+delete) | 0.76ms | 400ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | -48184 B | -1016 B | 102400 B | yes | PASS |
| query_workload (100 insert + 100 select) | -19704 B | -1010 B | 102400 B | yes | PASS |
| crud_cycle (10 rows × insert+update+delete) | -31792 B | -2015 B | 102400 B | yes | PASS |

## Detailed serial reports

### bulk_insert (setup + 100 insert)

# Perf Report — bulk_insert (setup + 100 insert).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.37ms |
| p95 | 0.50ms |
| p99 | 0.53ms |
| mean | 0.37ms |
| stdev | 0.07ms |
| min | 0.27ms |
| max | 0.53ms |
| total | 5.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.37ms | 0.38ms | -0.01ms | -3.08% |
| p95 | 0.50ms | 0.52ms | -0.02ms | -4.16% |
| p99 | 0.53ms | 0.54ms | -0.01ms | -1.83% |
| mean | 0.37ms | 0.38ms | -0.01ms | -1.64% |
| min | 0.27ms | 0.24ms | +0.04ms | +15.43% |
| max | 0.53ms | 0.54ms | -0.01ms | -1.27% |
| total | 5.62ms | 5.72ms | -0.09ms | -1.64% |

### query_workload (100 insert + 100 select)

# Perf Report — query_workload (100 insert + 100 select).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.32ms |
| p95 | 0.39ms |
| p99 | 0.42ms |
| mean | 0.33ms |
| stdev | 0.04ms |
| min | 0.29ms |
| max | 0.43ms |
| total | 5.00ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.32ms | 0.38ms | -0.06ms | -15.02% |
| p95 | 0.39ms | 0.63ms | -0.24ms | -38.26% |
| p99 | 0.42ms | 0.86ms | -0.44ms | -50.83% |
| mean | 0.33ms | 0.42ms | -0.09ms | -20.76% |
| min | 0.29ms | 0.32ms | -0.02ms | -7.56% |
| max | 0.43ms | 0.91ms | -0.48ms | -53.01% |
| total | 5.00ms | 6.31ms | -1.31ms | -20.76% |

### crud_cycle (10 rows × insert+update+delete)

# Perf Report — crud_cycle (10 rows × insert+update+delete).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.30ms |
| p95 | 0.36ms |
| p99 | 0.36ms |
| mean | 0.30ms |
| stdev | 0.04ms |
| min | 0.24ms |
| max | 0.37ms |
| total | 4.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.30ms | 0.30ms | +0.00ms | +0.28% |
| p95 | 0.36ms | 0.42ms | -0.06ms | -14.37% |
| p99 | 0.36ms | 0.42ms | -0.06ms | -14.10% |
| mean | 0.30ms | 0.30ms | -0.01ms | -1.70% |
| min | 0.24ms | 0.22ms | +0.02ms | +9.70% |
| max | 0.37ms | 0.42ms | -0.06ms | -14.03% |
| total | 4.45ms | 4.53ms | -0.08ms | -1.70% |

