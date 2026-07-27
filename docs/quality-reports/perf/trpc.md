# Perf Suite — trpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeProcedure_query | 0.00ms | 5ms | PASS | stable |
| invokeProcedure_mutation | 0.00ms | 5ms | PASS | improved |
| client_query | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeProcedure_query | 0.01ms | 10ms | PASS |
| invokeProcedure_mutation | 0.01ms | 10ms | PASS |
| client_query | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| invokeProcedure_query | 525360 B | 0 B | 102400 B | PASS |
| invokeProcedure_mutation | 522248 B | 0 B | 102400 B | PASS |
| client_query | 572856 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### invokeProcedure_query

# Perf Report — invokeProcedure_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -6.72% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -16.08% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -44.47% |
| mean | 0.00ms | 0.00ms | -0.00ms | -12.40% |
| min | 0.00ms | 0.00ms | +0.00ms | +9.17% |
| max | 0.01ms | 0.01ms | -0.00ms | -6.17% |
| total | 0.16ms | 0.18ms | -0.02ms | -12.40% |

### invokeProcedure_mutation

# Perf Report — invokeProcedure_mutation.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -15.16% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -65.69% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -49.91% |
| mean | 0.00ms | 0.00ms | -0.00ms | -32.73% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.17% |
| max | 0.00ms | 0.01ms | -0.01ms | -75.47% |
| total | 0.10ms | 0.15ms | -0.05ms | -32.73% |

### client_query

# Perf Report — client_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -37.53% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -8.60% |
| mean | 0.00ms | 0.00ms | -0.00ms | -21.38% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -18.91% |
| total | 0.14ms | 0.17ms | -0.04ms | -21.38% |

