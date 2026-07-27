# Perf Suite — trpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.01ms | 100ms | PASS | stable |
| mutation_batch (5 authenticated mutation) | 0.00ms | 100ms | PASS | stable |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.02ms | 100ms | PASS | stable |
| retry_recovery (5 flaky handler retry to success) | 0.03ms | 100ms | PASS | stable |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.04ms | 200ms | PASS |
| mutation_batch (5 authenticated mutation) | 0.03ms | 200ms | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.10ms | 200ms | PASS |
| retry_recovery (5 flaky handler retry to success) | 0.08ms | 200ms | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 561656 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 authenticated mutation) | 14952 B | 0 B | 102400 B | yes | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 720 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky handler retry to success) | 1040 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 96 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### router_dispatch_workflow (10 query mix via client)

# Perf Report — router_dispatch_workflow (10 query mix via client).serial

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
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +6.20% |
| p95 | 0.01ms | 0.02ms | -0.01ms | -62.24% |
| p99 | 0.01ms | 0.04ms | -0.02ms | -65.88% |
| mean | 0.01ms | 0.01ms | -0.00ms | -24.05% |
| min | 0.00ms | 0.00ms | +0.00ms | +6.41% |
| max | 0.01ms | 0.04ms | -0.03ms | -66.35% |
| total | 0.13ms | 0.16ms | -0.04ms | -24.05% |

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
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +12.60% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +2.21% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +7.40% |
| mean | 0.00ms | 0.00ms | +0.00ms | +14.18% |
| min | 0.00ms | 0.00ms | +0.00ms | +16.68% |
| max | 0.01ms | 0.00ms | +0.00ms | +8.63% |
| total | 0.07ms | 0.06ms | +0.01ms | +14.18% |

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
| max | 0.02ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +13.21% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -1.00% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -0.74% |
| mean | 0.02ms | 0.02ms | +0.00ms | +9.30% |
| min | 0.02ms | 0.02ms | +0.00ms | +13.83% |
| max | 0.02ms | 0.02ms | -0.00ms | -0.68% |
| total | 0.38ms | 0.35ms | +0.03ms | +9.30% |

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
| total | 0.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +16.46% |
| p95 | 0.03ms | 0.02ms | +0.00ms | +20.09% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +9.91% |
| mean | 0.02ms | 0.02ms | +0.00ms | +16.15% |
| min | 0.02ms | 0.02ms | +0.00ms | +14.17% |
| max | 0.03ms | 0.03ms | +0.00ms | +7.94% |
| total | 0.42ms | 0.37ms | +0.06ms | +16.15% |

### concurrent_batch (5 batchInvoke of 4 procedures each)

# Perf Report — concurrent_batch (5 batchInvoke of 4 procedures each).serial

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
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +10.14% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +19.17% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +14.37% |
| mean | 0.01ms | 0.01ms | +0.00ms | +4.63% |
| min | 0.01ms | 0.01ms | +0.00ms | +13.99% |
| max | 0.02ms | 0.02ms | +0.00ms | +13.23% |
| total | 0.22ms | 0.21ms | +0.01ms | +4.63% |

