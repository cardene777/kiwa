# Perf Suite — remix-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.06ms | 100ms | PASS | stable |
| action_batch (5 invokeAction) | 0.02ms | 100ms | PASS | stable |
| loader_error_handling (5 throw + catch) | 0.03ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.14ms | 200ms | PASS |
| action_batch (5 invokeAction) | 0.08ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.14ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 1800 B | 0 B | 102400 B | yes | PASS |
| action_batch (5 invokeAction) | -896 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | -12328 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### loader_workflow (10 invokeLoader)

# Perf Report — loader_workflow (10 invokeLoader).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.06ms |
| p99 | 0.07ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.07ms |
| total | 0.84ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.00ms | +2.31% |
| p95 | 0.06ms | 0.05ms | +0.00ms | +9.75% |
| p99 | 0.07ms | 0.07ms | -0.00ms | -2.98% |
| mean | 0.04ms | 0.04ms | +0.00ms | +1.56% |
| min | 0.03ms | 0.03ms | +0.00ms | +9.75% |
| max | 0.07ms | 0.08ms | -0.00ms | -5.09% |
| total | 0.84ms | 0.82ms | +0.01ms | +1.56% |

### action_batch (5 invokeAction)

# Perf Report — action_batch (5 invokeAction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.00ms | +36.16% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +1.84% |
| p99 | 0.03ms | 0.04ms | -0.01ms | -18.63% |
| mean | 0.02ms | 0.01ms | +0.00ms | +17.95% |
| min | 0.01ms | 0.01ms | +0.00ms | +18.50% |
| max | 0.04ms | 0.05ms | -0.01ms | -20.76% |
| total | 0.32ms | 0.28ms | +0.05ms | +17.95% |

### loader_error_handling (5 throw + catch)

# Perf Report — loader_error_handling (5 throw + catch).serial

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
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +0.31% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +12.88% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +26.51% |
| mean | 0.03ms | 0.03ms | +0.00ms | +2.33% |
| min | 0.03ms | 0.03ms | +0.00ms | +0.32% |
| max | 0.04ms | 0.03ms | +0.01ms | +29.85% |
| total | 0.55ms | 0.54ms | +0.01ms | +2.33% |

