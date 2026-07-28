# Perf Suite — query-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2116%) 以上の悪化が必要) |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +6304%) 以上の悪化が必要) |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.03ms | 100ms | PASS | stable (差 0.03ms が下限 0.5ms 未満で判定を保留) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.06ms | 200ms | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.03ms | 200ms | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.12ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 5984 B | 0 B | 102400 B | yes | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | -248 B | 0 B | 102400 B | yes | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 1216 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dashboard_fetch_workflow (10 fetchQuery across 4 providers)

# Perf Report — dashboard_fetch_workflow (10 fetchQuery across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -18.61% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -14.24% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -17.74% |
| mean | 0.01ms | 0.02ms | -0.00ms | -14.93% |
| min | 0.01ms | 0.01ms | -0.00ms | -24.31% |
| max | 0.02ms | 0.03ms | -0.01ms | -18.42% |
| total | 0.27ms | 0.31ms | -0.05ms | -14.93% |

### mutation_invalidate_batch (5 mutate with invalidate chain)

# Perf Report — mutation_invalidate_batch (5 mutate with invalidate chain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +0.01% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +14.98% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +29.41% |
| mean | 0.01ms | 0.01ms | +0.00ms | +6.88% |
| min | 0.01ms | 0.01ms | -0.00ms | -6.04% |
| max | 0.01ms | 0.01ms | +0.00ms | +32.33% |
| total | 0.14ms | 0.13ms | +0.01ms | +6.88% |

### subscribe_error_handling (5 fetch throw + catch + listener notify)

# Perf Report — subscribe_error_handling (5 fetch throw + catch + listener notify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.03ms | -0.00ms | -7.72% |
| p95 | 0.03ms | 0.06ms | -0.03ms | -46.80% |
| p99 | 0.03ms | 0.09ms | -0.06ms | -66.03% |
| mean | 0.03ms | 0.03ms | -0.01ms | -26.08% |
| min | 0.02ms | 0.03ms | -0.00ms | -9.29% |
| max | 0.03ms | 0.10ms | -0.07ms | -68.79% |
| total | 0.51ms | 0.69ms | -0.18ms | -26.08% |

