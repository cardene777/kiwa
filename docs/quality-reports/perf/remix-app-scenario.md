# Perf Suite — remix-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.31ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +655%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| action_batch (5 invokeAction) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2831%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| loader_error_handling (5 throw + catch) | 0.04ms | 100ms | PASS | stable (差 0.12ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.20ms | 200ms | PASS |
| action_batch (5 invokeAction) | 0.07ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.14ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 23848 B | -8584 B | 102400 B | yes | PASS |
| action_batch (5 invokeAction) | -14560 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | -1952 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### loader_workflow (10 invokeLoader)

# Perf Report — loader_workflow (10 invokeLoader).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.05ms |
| p95 | 0.31ms |
| p99 | 2.43ms |
| mean | 0.20ms |
| stdev | 0.65ms |
| min | 0.04ms |
| max | 2.96ms |
| total | 4.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.04ms | +0.01ms | +16.33% |
| p95 | 0.31ms | 0.08ms | +0.24ms | +310.38% |
| p99 | 2.43ms | 0.15ms | +2.28ms | +1478.53% |
| mean | 0.20ms | 0.06ms | +0.15ms | +265.70% |
| min | 0.04ms | 0.03ms | +0.00ms | +10.51% |
| max | 2.96ms | 0.17ms | +2.79ms | +1606.99% |
| total | 4.06ms | 1.11ms | +2.95ms | +265.70% |

### action_batch (5 invokeAction)

# Perf Report — action_batch (5 invokeAction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.00ms | -9.42% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +13.12% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +13.81% |
| mean | 0.02ms | 0.02ms | -0.00ms | -3.95% |
| min | 0.01ms | 0.02ms | -0.00ms | -14.05% |
| max | 0.02ms | 0.02ms | +0.00ms | +13.96% |
| total | 0.31ms | 0.33ms | -0.01ms | -3.95% |

### loader_error_handling (5 throw + catch)

# Perf Report — loader_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.07ms | -0.05ms | -60.30% |
| p95 | 0.04ms | 0.15ms | -0.12ms | -75.78% |
| p99 | 0.04ms | 0.34ms | -0.30ms | -88.60% |
| mean | 0.03ms | 0.09ms | -0.06ms | -66.04% |
| min | 0.03ms | 0.03ms | +0.00ms | +7.82% |
| max | 0.04ms | 0.39ms | -0.35ms | -89.87% |
| total | 0.62ms | 1.81ms | -1.20ms | -66.04% |

