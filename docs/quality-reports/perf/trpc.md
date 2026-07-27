# Perf Suite — trpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeProcedure_query | 0.00ms | 5ms | PASS | stable |
| invokeProcedure_mutation | 0.00ms | 5ms | PASS | stable |
| client_query | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeProcedure_query | 0.03ms | 10ms | PASS |
| invokeProcedure_mutation | 0.01ms | 10ms | PASS |
| client_query | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeProcedure_query | -1448 B | -46937 B | 102400 B | yes | PASS |
| invokeProcedure_mutation | -16 B | 0 B | 102400 B | yes | PASS |
| client_query | -20728 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeProcedure_query

# Perf Report — invokeProcedure_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +114.41% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +159.14% |
| p99 | 0.01ms | 0.01ms | +0.01ms | +97.03% |
| mean | 0.00ms | 0.00ms | +0.00ms | +139.52% |
| min | 0.00ms | 0.00ms | +0.00ms | +145.63% |
| max | 0.02ms | 0.01ms | +0.01ms | +89.77% |
| total | 0.39ms | 0.16ms | +0.22ms | +139.52% |

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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +27.02% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +13.06% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +55.36% |
| mean | 0.00ms | 0.00ms | +0.00ms | +20.17% |
| min | 0.00ms | 0.00ms | +0.00ms | +20.19% |
| max | 0.00ms | 0.00ms | +0.00ms | +68.41% |
| total | 0.12ms | 0.10ms | +0.02ms | +20.17% |

### client_query

# Perf Report — client_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +15.31% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +38.12% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +38.04% |
| mean | 0.00ms | 0.00ms | +0.00ms | +34.68% |
| min | 0.00ms | 0.00ms | +0.00ms | +16.60% |
| max | 0.03ms | 0.01ms | +0.02ms | +298.70% |
| total | 0.18ms | 0.13ms | +0.05ms | +34.68% |

