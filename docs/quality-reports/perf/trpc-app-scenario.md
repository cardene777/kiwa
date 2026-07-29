# Perf Suite — trpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +6561%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| mutation_batch (5 authenticated mutation) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +10546%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1647%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky handler retry to success) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1752%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2561%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.04ms | 200ms | PASS |
| mutation_batch (5 authenticated mutation) | 0.02ms | 200ms | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.09ms | 200ms | PASS |
| retry_recovery (5 flaky handler retry to success) | 0.07ms | 200ms | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 2216 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 authenticated mutation) | 712 B | 0 B | 102400 B | yes | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | -14968 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky handler retry to success) | 9512 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 4016 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -1.35% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +5.85% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -8.43% |
| mean | 0.01ms | 0.01ms | -0.00ms | -4.22% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.86% |
| max | 0.01ms | 0.01ms | -0.00ms | -10.51% |
| total | 0.12ms | 0.13ms | -0.01ms | -4.22% |

### mutation_batch (5 authenticated mutation)

# Perf Report — mutation_batch (5 authenticated mutation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +4.69% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +21.40% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +23.56% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.76% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.58% |
| max | 0.01ms | 0.01ms | +0.00ms | +24.04% |
| total | 0.07ms | 0.07ms | +0.01ms | +7.76% |

### middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch)

# Perf Report — middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch).serial

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
| total | 0.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -6.28% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -1.62% |
| p99 | 0.03ms | 0.06ms | -0.03ms | -53.39% |
| mean | 0.02ms | 0.02ms | -0.00ms | -14.66% |
| min | 0.02ms | 0.02ms | -0.00ms | -3.76% |
| max | 0.03ms | 0.07ms | -0.04ms | -58.74% |
| total | 0.39ms | 0.45ms | -0.07ms | -14.66% |

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
| total | 0.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +5.86% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -5.18% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -7.72% |
| mean | 0.02ms | 0.02ms | +0.00ms | +5.03% |
| min | 0.02ms | 0.01ms | +0.00ms | +16.95% |
| max | 0.03ms | 0.03ms | -0.00ms | -8.29% |
| total | 0.39ms | 0.37ms | +0.02ms | +5.03% |

### concurrent_batch (5 batchInvoke of 4 procedures each)

# Perf Report — concurrent_batch (5 batchInvoke of 4 procedures each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +0.01% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +9.80% |
| p99 | 0.04ms | 0.02ms | +0.02ms | +90.51% |
| mean | 0.01ms | 0.01ms | +0.00ms | +13.76% |
| min | 0.01ms | 0.01ms | +0.00ms | +0.49% |
| max | 0.05ms | 0.02ms | +0.03ms | +106.95% |
| total | 0.25ms | 0.22ms | +0.03ms | +13.76% |

