# Perf Suite — remix-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.05ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +655%) 以上の悪化が必要) |
| action_batch (5 invokeAction) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2831%) 以上の悪化が必要) |
| loader_error_handling (5 throw + catch) | 0.03ms | 100ms | PASS | stable (差 0.12ms が下限 0.5ms 未満で判定を保留) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.19ms | 200ms | PASS |
| action_batch (5 invokeAction) | 0.08ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.12ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 23272 B | 0 B | 102400 B | yes | PASS |
| action_batch (5 invokeAction) | -64 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | 6896 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.08ms |
| total | 0.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.01ms | -12.32% |
| p95 | 0.05ms | 0.08ms | -0.03ms | -33.46% |
| p99 | 0.07ms | 0.15ms | -0.08ms | -54.21% |
| mean | 0.04ms | 0.06ms | -0.01ms | -22.22% |
| min | 0.03ms | 0.03ms | -0.00ms | -6.56% |
| max | 0.08ms | 0.17ms | -0.10ms | -56.49% |
| total | 0.86ms | 1.11ms | -0.25ms | -22.22% |

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
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.00ms | -14.97% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +7.47% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +15.35% |
| mean | 0.01ms | 0.02ms | -0.00ms | -10.81% |
| min | 0.01ms | 0.02ms | -0.00ms | -16.22% |
| max | 0.02ms | 0.02ms | +0.00ms | +17.09% |
| total | 0.29ms | 0.33ms | -0.04ms | -10.81% |

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
| min | 0.03ms |
| max | 0.03ms |
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.07ms | -0.05ms | -63.95% |
| p95 | 0.03ms | 0.15ms | -0.12ms | -80.07% |
| p99 | 0.03ms | 0.34ms | -0.31ms | -90.97% |
| mean | 0.03ms | 0.09ms | -0.06ms | -69.69% |
| min | 0.03ms | 0.03ms | -0.00ms | -3.29% |
| max | 0.03ms | 0.39ms | -0.36ms | -92.05% |
| total | 0.55ms | 1.81ms | -1.26ms | -69.69% |

