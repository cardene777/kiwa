# Perf Suite — trpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.01ms | 100ms | PASS | stable |
| mutation_batch (5 authenticated mutation) | 0.01ms | 100ms | PASS | stable |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.08ms | 100ms | PASS | regressed |
| retry_recovery (5 flaky handler retry to success) | 0.02ms | 100ms | PASS | n/a (baseline seeded) |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.01ms | 100ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.03ms | 200ms | PASS |
| mutation_batch (5 authenticated mutation) | 0.02ms | 200ms | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.08ms | 200ms | PASS |
| retry_recovery (5 flaky handler retry to success) | 0.06ms | 200ms | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 1053104 B | 0 B | 102400 B | PASS |
| mutation_batch (5 authenticated mutation) | 468864 B | 0 B | 102400 B | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 290544 B | 0 B | 102400 B | PASS |
| retry_recovery (5 flaky handler retry to success) | 690288 B | 0 B | 102400 B | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 808104 B | 0 B | 102400 B | PASS |

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
| p50 | 0.00ms | 0.01ms | -0.00ms | -22.07% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -2.35% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +11.36% |
| mean | 0.01ms | 0.01ms | -0.00ms | -10.00% |
| min | 0.00ms | 0.00ms | +0.00ms | +5.98% |
| max | 0.01ms | 0.01ms | +0.00ms | +13.71% |
| total | 0.11ms | 0.12ms | -0.01ms | -10.00% |

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
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +30.16% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +82.38% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +49.50% |
| mean | 0.00ms | 0.00ms | +0.00ms | +32.94% |
| min | 0.00ms | 0.00ms | -0.00ms | -4.55% |
| max | 0.01ms | 0.00ms | +0.00ms | +43.71% |
| total | 0.08ms | 0.06ms | +0.02ms | +32.94% |

### middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch)

# Perf Report — middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.08ms |
| p99 | 0.10ms |
| mean | 0.03ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.10ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +10.49% |
| p95 | 0.08ms | 0.02ms | +0.06ms | +289.49% |
| p99 | 0.10ms | 0.02ms | +0.07ms | +321.88% |
| mean | 0.03ms | 0.02ms | +0.01ms | +52.01% |
| min | 0.02ms | 0.02ms | +0.00ms | +2.97% |
| max | 0.10ms | 0.02ms | +0.08ms | +329.11% |
| total | 0.51ms | 0.34ms | +0.17ms | +52.01% |

### retry_recovery (5 flaky handler retry to success)

# Perf Report — retry_recovery (5 flaky handler retry to success).serial

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
| total | 0.35ms |

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
| total | 0.19ms |

