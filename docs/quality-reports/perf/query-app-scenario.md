# Perf Suite — query-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2116%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.03ms | 100ms | PASS | stable (差 0.02ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.03ms | 100ms | PASS | stable (差 0.03ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.07ms | 200ms | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.04ms | 200ms | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.13ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 8184 B | -10766 B | 102400 B | yes | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 10568 B | 0 B | 102400 B | yes | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 1456 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dashboard_fetch_workflow (10 fetchQuery across 4 providers)

# Perf Report — dashboard_fetch_workflow (10 fetchQuery across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +5.76% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -1.31% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -2.07% |
| mean | 0.02ms | 0.02ms | +0.00ms | +2.50% |
| min | 0.01ms | 0.01ms | +0.00ms | +3.65% |
| max | 0.03ms | 0.03ms | -0.00ms | -2.21% |
| total | 0.32ms | 0.31ms | +0.01ms | +2.50% |

### mutation_invalidate_batch (5 mutate with invalidate chain)

# Perf Report — mutation_invalidate_batch (5 mutate with invalidate chain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.11ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.01ms | +123.21% |
| p95 | 0.03ms | 0.01ms | +0.02ms | +248.24% |
| p99 | 0.10ms | 0.01ms | +0.09ms | +931.77% |
| mean | 0.02ms | 0.01ms | +0.01ms | +184.28% |
| min | 0.01ms | 0.01ms | +0.00ms | +27.53% |
| max | 0.11ms | 0.01ms | +0.10ms | +1070.17% |
| total | 0.38ms | 0.13ms | +0.25ms | +184.28% |

### subscribe_error_handling (5 fetch throw + catch + listener notify)

# Perf Report — subscribe_error_handling (5 fetch throw + catch + listener notify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +4.14% |
| p95 | 0.03ms | 0.06ms | -0.03ms | -42.88% |
| p99 | 0.04ms | 0.09ms | -0.06ms | -59.23% |
| mean | 0.03ms | 0.03ms | -0.01ms | -16.77% |
| min | 0.03ms | 0.03ms | +0.00ms | +1.49% |
| max | 0.04ms | 0.10ms | -0.06ms | -61.57% |
| total | 0.57ms | 0.69ms | -0.12ms | -16.77% |

