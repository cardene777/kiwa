# Perf Suite — remix-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.05ms | 100ms | PASS | stable |
| action_batch (5 invokeAction) | 0.01ms | 100ms | PASS | stable |
| loader_error_handling (5 throw + catch) | 0.04ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.16ms | 200ms | PASS |
| action_batch (5 invokeAction) | 0.04ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 1316776 B | 0 B | 102400 B | PASS |
| action_batch (5 invokeAction) | 634856 B | 0 B | 102400 B | PASS |
| loader_error_handling (5 throw + catch) | 684120 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### loader_workflow (10 invokeLoader)

# Perf Report — loader_workflow (10 invokeLoader).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.07ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.07ms |
| total | 0.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.00ms | +0.22% |
| p95 | 0.05ms | 0.05ms | -0.01ms | -10.71% |
| p99 | 0.07ms | 0.06ms | +0.00ms | +5.56% |
| mean | 0.04ms | 0.04ms | -0.00ms | -0.83% |
| min | 0.03ms | 0.03ms | +0.00ms | +2.31% |
| max | 0.07ms | 0.07ms | +0.01ms | +8.86% |
| total | 0.80ms | 0.81ms | -0.01ms | -0.83% |

### action_batch (5 invokeAction)

# Perf Report — action_batch (5 invokeAction).serial

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
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -24.63% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -24.33% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -25.20% |
| mean | 0.01ms | 0.01ms | -0.00ms | -23.51% |
| min | 0.01ms | 0.01ms | -0.00ms | -17.92% |
| max | 0.01ms | 0.02ms | -0.00ms | -25.40% |
| total | 0.16ms | 0.21ms | -0.05ms | -23.51% |

### loader_error_handling (5 throw + catch)

# Perf Report — loader_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.07ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -8.38% |
| p95 | 0.04ms | 0.02ms | +0.01ms | +47.81% |
| p99 | 0.07ms | 0.03ms | +0.04ms | +119.33% |
| mean | 0.02ms | 0.02ms | +0.00ms | +10.02% |
| min | 0.02ms | 0.02ms | -0.00ms | -10.93% |
| max | 0.07ms | 0.03ms | +0.04ms | +133.42% |
| total | 0.47ms | 0.43ms | +0.04ms | +10.02% |

