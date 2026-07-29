# Perf Suite — orm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | 10.95ms | 200ms | PASS | regressed — gate 無効 (regressionGate=false) |
| query_workload (100 insert + 100 select) | 8.14ms | 200ms | PASS | regressed — gate 無効 (regressionGate=false) |
| crud_cycle (10 rows × insert+update+delete) | 3.88ms | 200ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| bulk_insert (setup + 100 insert) | 18.86ms | 400ms | PASS |
| query_workload (100 insert + 100 select) | 5.77ms | 400ms | PASS |
| crud_cycle (10 rows × insert+update+delete) | 5.94ms | 400ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | -53840 B | 0 B | 102400 B | yes | PASS |
| query_workload (100 insert + 100 select) | -23832 B | 32864 B | 102400 B | yes | PASS |
| crud_cycle (10 rows × insert+update+delete) | -34704 B | -67354 B | 102400 B | yes | PASS |

## Detailed serial reports

### bulk_insert (setup + 100 insert)

# Perf Report — bulk_insert (setup + 100 insert).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 2.55ms |
| p95 | 10.95ms |
| p99 | 13.88ms |
| mean | 4.66ms |
| stdev | 3.84ms |
| min | 1.16ms |
| max | 14.61ms |
| total | 69.93ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 2.55ms | 0.39ms | +2.16ms | +561.37% |
| p95 | 10.95ms | 0.88ms | +10.06ms | +1137.52% |
| p99 | 13.88ms | 1.52ms | +12.35ms | +810.95% |
| mean | 4.66ms | 0.46ms | +4.21ms | +923.97% |
| min | 1.16ms | 0.24ms | +0.93ms | +390.18% |
| max | 14.61ms | 1.92ms | +12.69ms | +659.40% |
| total | 69.93ms | 91.06ms | -21.13ms | -23.20% |

### query_workload (100 insert + 100 select)

# Perf Report — query_workload (100 insert + 100 select).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 2.50ms |
| p95 | 8.14ms |
| p99 | 11.44ms |
| mean | 3.54ms |
| stdev | 2.90ms |
| min | 1.06ms |
| max | 12.26ms |
| total | 53.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 2.50ms | 0.29ms | +2.22ms | +767.70% |
| p95 | 8.14ms | 0.41ms | +7.73ms | +1895.85% |
| p99 | 11.44ms | 0.45ms | +10.99ms | +2438.38% |
| mean | 3.54ms | 0.30ms | +3.24ms | +1063.30% |
| min | 1.06ms | 0.22ms | +0.84ms | +374.37% |
| max | 12.26ms | 0.46ms | +11.80ms | +2581.90% |
| total | 53.16ms | 60.93ms | -7.77ms | -12.75% |

### crud_cycle (10 rows × insert+update+delete)

# Perf Report — crud_cycle (10 rows × insert+update+delete).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 2.48ms |
| p95 | 3.88ms |
| p99 | 3.92ms |
| mean | 2.37ms |
| stdev | 0.92ms |
| min | 0.93ms |
| max | 3.93ms |
| total | 35.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 2.48ms | 0.22ms | +2.26ms | +1025.24% |
| p95 | 3.88ms | 0.30ms | +3.58ms | +1186.70% |
| p99 | 3.92ms | 0.33ms | +3.59ms | +1092.30% |
| mean | 2.37ms | 0.23ms | +2.14ms | +940.54% |
| min | 0.93ms | 0.17ms | +0.76ms | +447.93% |
| max | 3.93ms | 0.53ms | +3.40ms | +639.65% |
| total | 35.53ms | 45.52ms | -10.00ms | -21.96% |

