# Perf Suite — remix-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.07ms | 100ms | PASS | stable |
| action_batch (5 invokeAction) | 0.02ms | 100ms | PASS | stable |
| loader_error_handling (5 throw + catch) | 0.03ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.20ms | 200ms | PASS |
| action_batch (5 invokeAction) | 0.05ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.12ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 7592 B | 0 B | 102400 B | yes | PASS |
| action_batch (5 invokeAction) | -18024 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | -15616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### loader_workflow (10 invokeLoader)

# Perf Report — loader_workflow (10 invokeLoader).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.07ms |
| p99 | 0.09ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.09ms |
| total | 0.88ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.00ms | +5.60% |
| p95 | 0.07ms | 0.05ms | +0.02ms | +33.65% |
| p99 | 0.09ms | 0.07ms | +0.01ms | +20.32% |
| mean | 0.04ms | 0.04ms | +0.00ms | +7.14% |
| min | 0.03ms | 0.03ms | -0.00ms | -1.67% |
| max | 0.09ms | 0.08ms | +0.01ms | +18.12% |
| total | 0.88ms | 0.82ms | +0.06ms | +7.14% |

### action_batch (5 invokeAction)

# Perf Report — action_batch (5 invokeAction).serial

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
| p50 | 0.01ms | 0.01ms | +0.00ms | +13.56% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -24.82% |
| p99 | 0.02ms | 0.04ms | -0.03ms | -63.27% |
| mean | 0.01ms | 0.01ms | -0.00ms | -9.32% |
| min | 0.01ms | 0.01ms | -0.00ms | -4.34% |
| max | 0.02ms | 0.05ms | -0.03ms | -67.27% |
| total | 0.25ms | 0.28ms | -0.03ms | -9.32% |

### loader_error_handling (5 throw + catch)

# Perf Report — loader_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -4.85% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -2.05% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +7.77% |
| mean | 0.03ms | 0.03ms | -0.00ms | -3.33% |
| min | 0.02ms | 0.03ms | -0.00ms | -4.32% |
| max | 0.03ms | 0.03ms | +0.00ms | +10.18% |
| total | 0.52ms | 0.54ms | -0.02ms | -3.33% |

