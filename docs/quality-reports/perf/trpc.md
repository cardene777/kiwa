# Perf Suite — trpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeProcedure_query | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +11859%) 以上の悪化が必要) |
| invokeProcedure_mutation | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +79732%) 以上の悪化が必要) |
| client_query | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +51741%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeProcedure_query | 0.01ms | 10ms | PASS |
| invokeProcedure_mutation | 0.01ms | 10ms | PASS |
| client_query | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeProcedure_query | -8872 B | 0 B | 102400 B | yes | PASS |
| invokeProcedure_mutation | 424 B | 0 B | 102400 B | yes | PASS |
| client_query | 712 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -18.74% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -8.89% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -36.74% |
| mean | 0.00ms | 0.00ms | -0.00ms | -9.69% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.40% |
| max | 0.02ms | 0.03ms | -0.01ms | -21.47% |
| total | 0.24ms | 0.27ms | -0.03ms | -9.69% |

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
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +8.40% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +13.56% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +13.82% |
| mean | 0.00ms | 0.00ms | +0.00ms | +13.26% |
| min | 0.00ms | 0.00ms | +0.00ms | +9.17% |
| max | 0.01ms | 0.00ms | +0.01ms | +211.69% |
| total | 0.13ms | 0.11ms | +0.01ms | +13.26% |

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
| max | 0.01ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.20% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -4.89% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +139.60% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.84% |
| min | 0.00ms | 0.00ms | -0.00ms | -7.58% |
| max | 0.01ms | 0.01ms | +0.01ms | +171.22% |
| total | 0.15ms | 0.14ms | +0.01ms | +8.84% |

