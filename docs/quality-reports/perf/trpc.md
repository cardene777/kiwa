# Perf Suite — trpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeProcedure_query | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +11859%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| invokeProcedure_mutation | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +79732%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| client_query | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +51741%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeProcedure_query | 0.04ms | 10ms | PASS |
| invokeProcedure_mutation | 0.01ms | 10ms | PASS |
| client_query | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeProcedure_query | -13112 B | 0 B | 102400 B | yes | PASS |
| invokeProcedure_mutation | 2408 B | 0 B | 102400 B | yes | PASS |
| client_query | 424 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -48.31% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -69.42% |
| mean | 0.00ms | 0.00ms | -0.00ms | -31.40% |
| min | 0.00ms | 0.00ms | +0.00ms | +8.20% |
| max | 0.01ms | 0.03ms | -0.02ms | -64.27% |
| total | 0.18ms | 0.27ms | -0.08ms | -31.40% |

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +7.02% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -30.50% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.01% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | -0.00ms | -26.60% |
| total | 0.11ms | 0.11ms | +0.00ms | +1.01% |

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
| p95 | 0.00ms | 0.00ms | -0.00ms | -4.03% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -2.01% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.86% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +45.62% |
| total | 0.14ms | 0.14ms | +0.00ms | +1.86% |

