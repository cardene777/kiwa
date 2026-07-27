# Perf Suite — query-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.02ms | 100ms | PASS | stable |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.01ms | 100ms | PASS | stable |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.03ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.08ms | 200ms | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.03ms | 200ms | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.12ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 662472 B | 0 B | 102400 B | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 617904 B | 0 B | 102400 B | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 305464 B | 0 B | 102400 B | PASS |

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
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.01ms | -34.85% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -18.53% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -22.41% |
| mean | 0.01ms | 0.02ms | -0.00ms | -26.89% |
| min | 0.01ms | 0.01ms | -0.00ms | -13.24% |
| max | 0.02ms | 0.03ms | -0.01ms | -23.27% |
| total | 0.25ms | 0.34ms | -0.09ms | -26.89% |

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
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -17.15% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +0.66% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +23.46% |
| mean | 0.01ms | 0.01ms | -0.00ms | -13.82% |
| min | 0.01ms | 0.01ms | -0.00ms | -25.91% |
| max | 0.01ms | 0.01ms | +0.00ms | +28.88% |
| total | 0.13ms | 0.15ms | -0.02ms | -13.82% |

### subscribe_error_handling (5 fetch throw + catch + listener notify)

# Perf Report — subscribe_error_handling (5 fetch throw + catch + listener notify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.03ms | -0.01ms | -18.07% |
| p95 | 0.03ms | 0.04ms | -0.01ms | -28.69% |
| p99 | 0.03ms | 0.04ms | -0.01ms | -17.25% |
| mean | 0.02ms | 0.03ms | -0.01ms | -18.08% |
| min | 0.02ms | 0.03ms | -0.00ms | -10.40% |
| max | 0.03ms | 0.04ms | -0.01ms | -14.45% |
| total | 0.50ms | 0.61ms | -0.11ms | -18.08% |

