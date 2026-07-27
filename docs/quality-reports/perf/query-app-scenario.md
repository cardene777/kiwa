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
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.05ms | 200ms | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.03ms | 200ms | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.12ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 6192 B | 0 B | 102400 B | yes | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 18728 B | 0 B | 102400 B | yes | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 4912 B | 0 B | 102400 B | yes | PASS |

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
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +13.89% |
| p95 | 0.02ms | 0.04ms | -0.02ms | -52.52% |
| p99 | 0.03ms | 0.06ms | -0.03ms | -55.43% |
| mean | 0.01ms | 0.02ms | -0.00ms | -14.54% |
| min | 0.01ms | 0.01ms | +0.00ms | +22.57% |
| max | 0.03ms | 0.06ms | -0.04ms | -55.93% |
| total | 0.29ms | 0.34ms | -0.05ms | -14.54% |

### mutation_invalidate_batch (5 mutate with invalidate chain)

# Perf Report — mutation_invalidate_batch (5 mutate with invalidate chain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.07ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.09ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -6.62% |
| p95 | 0.01ms | 0.01ms | +0.01ms | +75.07% |
| p99 | 0.07ms | 0.01ms | +0.06ms | +639.64% |
| mean | 0.01ms | 0.01ms | +0.00ms | +51.79% |
| min | 0.01ms | 0.01ms | -0.00ms | -20.52% |
| max | 0.09ms | 0.01ms | +0.08ms | +750.18% |
| total | 0.21ms | 0.14ms | +0.07ms | +51.79% |

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
| p50 | 0.02ms | 0.03ms | -0.00ms | -6.04% |
| p95 | 0.03ms | 0.07ms | -0.04ms | -58.08% |
| p99 | 0.03ms | 0.10ms | -0.07ms | -70.22% |
| mean | 0.03ms | 0.04ms | -0.01ms | -31.19% |
| min | 0.02ms | 0.03ms | -0.00ms | -13.13% |
| max | 0.03ms | 0.11ms | -0.08ms | -72.02% |
| total | 0.51ms | 0.74ms | -0.23ms | -31.19% |

