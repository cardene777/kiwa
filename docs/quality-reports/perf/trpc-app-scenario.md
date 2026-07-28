# Perf Suite — trpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.02ms | 100ms | PASS | stable (差 0.01ms が下限 0.5ms 未満で判定を保留) |
| mutation_batch (5 authenticated mutation) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +10546%) 以上の悪化が必要) |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.11ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1647%) 以上の悪化が必要) |
| retry_recovery (5 flaky handler retry to success) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1752%) 以上の悪化が必要) |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2561%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.04ms | 200ms | PASS |
| mutation_batch (5 authenticated mutation) | 0.02ms | 200ms | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.08ms | 200ms | PASS |
| retry_recovery (5 flaky handler retry to success) | 0.06ms | 200ms | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 15424 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 authenticated mutation) | 616 B | 0 B | 102400 B | yes | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | -16432 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky handler retry to success) | 712 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 3920 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### router_dispatch_workflow (10 query mix via client)

# Perf Report — router_dispatch_workflow (10 query mix via client).serial

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
| p50 | 0.01ms | 0.01ms | +0.01ms | +85.14% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +107.04% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +77.26% |
| mean | 0.01ms | 0.01ms | +0.01ms | +92.29% |
| min | 0.01ms | 0.00ms | +0.01ms | +128.21% |
| max | 0.02ms | 0.01ms | +0.01ms | +72.92% |
| total | 0.25ms | 0.13ms | +0.12ms | +92.29% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +6.68% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +10.03% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +13.89% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.37% |
| min | 0.00ms | 0.00ms | +0.00ms | +3.02% |
| max | 0.01ms | 0.01ms | +0.00ms | +14.73% |
| total | 0.07ms | 0.07ms | +0.01ms | +8.37% |

### middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch)

# Perf Report — middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.11ms |
| p99 | 0.14ms |
| mean | 0.05ms |
| stdev | 0.03ms |
| min | 0.02ms |
| max | 0.14ms |
| total | 0.97ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.02ms | +0.02ms | +100.90% |
| p95 | 0.11ms | 0.03ms | +0.08ms | +277.69% |
| p99 | 0.14ms | 0.06ms | +0.07ms | +111.19% |
| mean | 0.05ms | 0.02ms | +0.03ms | +113.89% |
| min | 0.02ms | 0.02ms | +0.00ms | +25.35% |
| max | 0.14ms | 0.07ms | +0.07ms | +93.98% |
| total | 0.97ms | 0.45ms | +0.52ms | +113.89% |

### retry_recovery (5 flaky handler retry to success)

# Perf Report — retry_recovery (5 flaky handler retry to success).serial

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
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.00ms | -14.69% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -29.51% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -27.44% |
| mean | 0.02ms | 0.02ms | -0.00ms | -15.41% |
| min | 0.01ms | 0.01ms | -0.00ms | -4.24% |
| max | 0.02ms | 0.03ms | -0.01ms | -26.97% |
| total | 0.32ms | 0.37ms | -0.06ms | -15.41% |

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
| p50 | 0.01ms | 0.01ms | +0.00ms | +0.67% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +9.01% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +2.83% |
| mean | 0.01ms | 0.01ms | -0.00ms | -0.10% |
| min | 0.01ms | 0.01ms | +0.00ms | +1.98% |
| max | 0.02ms | 0.02ms | +0.00ms | +1.57% |
| total | 0.22ms | 0.22ms | -0.00ms | -0.10% |

