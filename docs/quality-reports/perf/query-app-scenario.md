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
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 9912 B | 0 B | 102400 B | yes | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 8512 B | 0 B | 102400 B | yes | PASS |
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
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -8.51% |
| p95 | 0.02ms | 0.04ms | -0.02ms | -49.81% |
| p99 | 0.02ms | 0.06ms | -0.04ms | -62.32% |
| mean | 0.01ms | 0.02ms | -0.00ms | -25.86% |
| min | 0.01ms | 0.01ms | -0.00ms | -1.55% |
| max | 0.02ms | 0.06ms | -0.04ms | -64.45% |
| total | 0.26ms | 0.34ms | -0.09ms | -25.86% |

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
| p50 | 0.01ms | 0.01ms | -0.00ms | -3.46% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +23.44% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +14.25% |
| mean | 0.01ms | 0.01ms | +0.00ms | +0.69% |
| min | 0.01ms | 0.01ms | -0.00ms | -11.24% |
| max | 0.01ms | 0.01ms | +0.00ms | +12.45% |
| total | 0.14ms | 0.14ms | +0.00ms | +0.69% |

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
| max | 0.04ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.03ms | -0.00ms | -7.37% |
| p95 | 0.03ms | 0.07ms | -0.04ms | -54.41% |
| p99 | 0.03ms | 0.10ms | -0.07ms | -66.49% |
| mean | 0.03ms | 0.04ms | -0.01ms | -30.43% |
| min | 0.02ms | 0.03ms | -0.00ms | -13.94% |
| max | 0.04ms | 0.11ms | -0.08ms | -68.29% |
| total | 0.51ms | 0.74ms | -0.22ms | -30.43% |

