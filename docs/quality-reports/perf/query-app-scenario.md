# Perf Suite — query-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.02ms | 100ms | PASS | stable |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.01ms | 100ms | PASS | stable |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.04ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.05ms | 200ms | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.03ms | 200ms | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.18ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 4184 B | 0 B | 102400 B | yes | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 7664 B | 0 B | 102400 B | yes | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 1336 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.01ms | 0.01ms | -0.00ms | -1.57% |
| p95 | 0.02ms | 0.04ms | -0.02ms | -51.39% |
| p99 | 0.02ms | 0.06ms | -0.04ms | -63.74% |
| mean | 0.01ms | 0.02ms | -0.00ms | -21.40% |
| min | 0.01ms | 0.01ms | +0.00ms | +1.56% |
| max | 0.02ms | 0.06ms | -0.04ms | -65.85% |
| total | 0.27ms | 0.34ms | -0.07ms | -21.40% |

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
| min | 0.00ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -22.08% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +11.23% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +10.51% |
| mean | 0.01ms | 0.01ms | -0.00ms | -15.34% |
| min | 0.00ms | 0.01ms | -0.00ms | -21.19% |
| max | 0.01ms | 0.01ms | +0.00ms | +10.37% |
| total | 0.12ms | 0.14ms | -0.02ms | -15.34% |

### subscribe_error_handling (5 fetch throw + catch + listener notify)

# Perf Report — subscribe_error_handling (5 fetch throw + catch + listener notify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.03ms | -0.00ms | -9.18% |
| p95 | 0.04ms | 0.07ms | -0.03ms | -45.76% |
| p99 | 0.05ms | 0.10ms | -0.06ms | -54.45% |
| mean | 0.03ms | 0.04ms | -0.01ms | -27.90% |
| min | 0.02ms | 0.03ms | -0.00ms | -12.16% |
| max | 0.05ms | 0.11ms | -0.06ms | -55.73% |
| total | 0.53ms | 0.74ms | -0.21ms | -27.90% |

