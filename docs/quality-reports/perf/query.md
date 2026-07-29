# Perf Suite — query

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| fetchQuery | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +32787%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| mutate | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +37450%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| invalidateQuery | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +108932%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchQuery | 0.02ms | 10ms | PASS |
| mutate | 0.02ms | 10ms | PASS |
| invalidateQuery | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| fetchQuery | 9880 B | -47023 B | 102400 B | yes | PASS |
| mutate | -296 B | 0 B | 102400 B | yes | PASS |
| invalidateQuery | -320 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### fetchQuery

# Perf Report — fetchQuery.serial

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +6.72% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +88.80% |
| p99 | 0.01ms | 0.01ms | +0.01ms | +98.81% |
| mean | 0.00ms | 0.00ms | +0.00ms | +33.99% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.00ms | +29.38% |
| total | 0.24ms | 0.18ms | +0.06ms | +33.99% |

### mutate

# Perf Report — mutate.serial

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
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +11.20% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -20.93% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -17.21% |
| mean | 0.00ms | 0.00ms | -0.00ms | -20.70% |
| min | 0.00ms | 0.00ms | +0.00ms | +18.77% |
| max | 0.01ms | 0.07ms | -0.06ms | -80.78% |
| total | 0.21ms | 0.26ms | -0.05ms | -20.70% |

### invalidateQuery

# Perf Report — invalidateQuery.serial

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
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +66.09% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.06% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -16.56% |
| total | 0.09ms | 0.09ms | +0.00ms | +2.06% |

