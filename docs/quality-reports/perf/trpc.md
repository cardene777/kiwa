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
| invokeProcedure_query | 0.01ms | 10ms | PASS |
| invokeProcedure_mutation | 0.01ms | 10ms | PASS |
| client_query | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeProcedure_query | -14832 B | 0 B | 102400 B | yes | PASS |
| invokeProcedure_mutation | -400 B | 0 B | 102400 B | yes | PASS |
| client_query | -15152 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeProcedure_query

# Perf Report — invokeProcedure_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +14.24% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +146.77% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +136.53% |
| mean | 0.00ms | 0.00ms | +0.00ms | +56.82% |
| min | 0.00ms | 0.00ms | +0.00ms | +9.17% |
| max | 0.02ms | 0.01ms | +0.01ms | +55.27% |
| total | 0.25ms | 0.16ms | +0.09ms | +56.82% |

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
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.08ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +27.02% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +13.39% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +86.12% |
| mean | 0.00ms | 0.00ms | +0.00ms | +95.64% |
| min | 0.00ms | 0.00ms | +0.00ms | +30.05% |
| max | 0.08ms | 0.00ms | +0.07ms | +4677.32% |
| total | 0.20ms | 0.10ms | +0.10ms | +95.64% |

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
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +7.75% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +19.23% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +52.94% |
| mean | 0.00ms | 0.00ms | +0.00ms | +21.42% |
| min | 0.00ms | 0.00ms | +0.00ms | +8.40% |
| max | 0.01ms | 0.01ms | +0.01ms | +113.36% |
| total | 0.16ms | 0.13ms | +0.03ms | +21.42% |

