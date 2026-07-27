# Perf Suite — trpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.01ms | 100ms | PASS | stable |
| mutation_batch (5 authenticated mutation) | 0.00ms | 100ms | PASS | stable |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.02ms | 100ms | PASS | stable |
| retry_recovery (5 flaky handler retry to success) | 0.03ms | 100ms | PASS | stable |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.03ms | 200ms | PASS |
| mutation_batch (5 authenticated mutation) | 0.02ms | 200ms | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.09ms | 200ms | PASS |
| retry_recovery (5 flaky handler retry to success) | 0.08ms | 200ms | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | -5832 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 authenticated mutation) | 6864 B | 0 B | 102400 B | yes | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 832 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky handler retry to success) | 1688 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 192 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### router_dispatch_workflow (10 query mix via client)

# Perf Report — router_dispatch_workflow (10 query mix via client).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.01ms | -0.00ms | -18.25% |
| p95 | 0.01ms | 0.02ms | -0.01ms | -66.98% |
| p99 | 0.01ms | 0.04ms | -0.02ms | -70.20% |
| mean | 0.01ms | 0.01ms | -0.00ms | -35.74% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.92% |
| max | 0.01ms | 0.04ms | -0.03ms | -70.62% |
| total | 0.11ms | 0.16ms | -0.06ms | -35.74% |

### mutation_batch (5 authenticated mutation)

# Perf Report — mutation_batch (5 authenticated mutation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +27.40% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +8.61% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +26.76% |
| mean | 0.00ms | 0.00ms | +0.00ms | +26.97% |
| min | 0.00ms | 0.00ms | +0.00ms | +11.68% |
| max | 0.01ms | 0.00ms | +0.00ms | +31.04% |
| total | 0.08ms | 0.06ms | +0.02ms | +26.97% |

### middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch)

# Perf Report — middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +1.04% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -8.73% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +0.56% |
| mean | 0.02ms | 0.02ms | +0.00ms | +1.11% |
| min | 0.02ms | 0.02ms | +0.00ms | +0.53% |
| max | 0.03ms | 0.02ms | +0.00ms | +2.88% |
| total | 0.35ms | 0.35ms | +0.00ms | +1.11% |

### retry_recovery (5 flaky handler retry to success)

# Perf Report — retry_recovery (5 flaky handler retry to success).serial

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
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +3.81% |
| p95 | 0.03ms | 0.02ms | +0.00ms | +4.45% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -15.01% |
| mean | 0.02ms | 0.02ms | +0.00ms | +3.01% |
| min | 0.02ms | 0.02ms | +0.00ms | +1.05% |
| max | 0.03ms | 0.03ms | -0.01ms | -18.78% |
| total | 0.38ms | 0.37ms | +0.01ms | +3.01% |

### concurrent_batch (5 batchInvoke of 4 procedures each)

# Perf Report — concurrent_batch (5 batchInvoke of 4 procedures each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -12.97% |
| p95 | 0.01ms | 0.02ms | -0.01ms | -37.15% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -7.12% |
| mean | 0.01ms | 0.01ms | -0.00ms | -18.80% |
| min | 0.01ms | 0.01ms | -0.00ms | -4.31% |
| max | 0.02ms | 0.02ms | 0.00ms | 0.00% |
| total | 0.17ms | 0.21ms | -0.04ms | -18.80% |

