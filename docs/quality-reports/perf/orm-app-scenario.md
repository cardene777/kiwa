# Perf Suite — orm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | 0.46ms | 200ms | PASS | stable |
| query_workload (100 insert + 100 select) | 0.59ms | 200ms | PASS | stable |
| crud_cycle (10 rows × insert+update+delete) | 0.47ms | 200ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| bulk_insert (setup + 100 insert) | 1.25ms | 400ms | PASS |
| query_workload (100 insert + 100 select) | 1.15ms | 400ms | PASS |
| crud_cycle (10 rows × insert+update+delete) | 0.84ms | 400ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | -45624 B | -2020 B | 102400 B | yes | PASS |
| query_workload (100 insert + 100 select) | -17912 B | -2018 B | 102400 B | yes | PASS |
| crud_cycle (10 rows × insert+update+delete) | -31696 B | -1009 B | 102400 B | yes | PASS |

## Detailed serial reports

### bulk_insert (setup + 100 insert)

# Perf Report — bulk_insert (setup + 100 insert).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.35ms |
| p95 | 0.46ms |
| p99 | 0.52ms |
| mean | 0.36ms |
| stdev | 0.07ms |
| min | 0.27ms |
| max | 0.53ms |
| total | 5.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.35ms | 0.38ms | -0.03ms | -8.04% |
| p95 | 0.46ms | 0.52ms | -0.07ms | -12.71% |
| p99 | 0.52ms | 0.54ms | -0.02ms | -3.70% |
| mean | 0.36ms | 0.38ms | -0.02ms | -6.39% |
| min | 0.27ms | 0.24ms | +0.04ms | +16.24% |
| max | 0.53ms | 0.54ms | -0.01ms | -1.51% |
| total | 5.35ms | 5.72ms | -0.37ms | -6.39% |

### query_workload (100 insert + 100 select)

# Perf Report — query_workload (100 insert + 100 select).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.46ms |
| p95 | 0.59ms |
| p99 | 0.68ms |
| mean | 0.46ms |
| stdev | 0.08ms |
| min | 0.36ms |
| max | 0.70ms |
| total | 6.95ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.46ms | 0.38ms | +0.08ms | +20.86% |
| p95 | 0.59ms | 0.63ms | -0.04ms | -6.58% |
| p99 | 0.68ms | 0.86ms | -0.18ms | -20.51% |
| mean | 0.46ms | 0.42ms | +0.04ms | +10.16% |
| min | 0.36ms | 0.32ms | +0.04ms | +11.89% |
| max | 0.70ms | 0.91ms | -0.21ms | -22.92% |
| total | 6.95ms | 6.31ms | +0.64ms | +10.16% |

### crud_cycle (10 rows × insert+update+delete)

# Perf Report — crud_cycle (10 rows × insert+update+delete).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.36ms |
| p95 | 0.47ms |
| p99 | 0.49ms |
| mean | 0.37ms |
| stdev | 0.06ms |
| min | 0.30ms |
| max | 0.49ms |
| total | 5.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.36ms | 0.30ms | +0.06ms | +19.65% |
| p95 | 0.47ms | 0.42ms | +0.05ms | +12.40% |
| p99 | 0.49ms | 0.42ms | +0.06ms | +15.20% |
| mean | 0.37ms | 0.30ms | +0.07ms | +23.80% |
| min | 0.30ms | 0.22ms | +0.08ms | +37.06% |
| max | 0.49ms | 0.42ms | +0.07ms | +15.89% |
| total | 5.60ms | 4.53ms | +1.08ms | +23.80% |

