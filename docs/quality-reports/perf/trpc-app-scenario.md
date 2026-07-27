# Perf Suite — trpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.01ms | 100ms | PASS | stable |
| mutation_batch (5 authenticated mutation) | 0.01ms | 100ms | PASS | stable |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.02ms | 100ms | PASS | stable |
| retry_recovery (5 flaky handler retry to success) | 0.04ms | 100ms | PASS | stable |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.04ms | 200ms | PASS |
| mutation_batch (5 authenticated mutation) | 0.02ms | 200ms | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.10ms | 200ms | PASS |
| retry_recovery (5 flaky handler retry to success) | 0.07ms | 200ms | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | -5320 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 authenticated mutation) | 8016 B | 0 B | 102400 B | yes | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 912 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky handler retry to success) | 1216 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | -1264 B | 0 B | 102400 B | yes | PASS |

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
| min | 0.01ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +13.87% |
| p95 | 0.01ms | 0.02ms | -0.01ms | -58.07% |
| p99 | 0.01ms | 0.04ms | -0.02ms | -63.41% |
| mean | 0.01ms | 0.01ms | -0.00ms | -18.03% |
| min | 0.01ms | 0.00ms | +0.00ms | +11.01% |
| max | 0.01ms | 0.04ms | -0.03ms | -64.10% |
| total | 0.14ms | 0.16ms | -0.03ms | -18.03% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +45.17% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +11.66% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +21.08% |
| mean | 0.00ms | 0.00ms | +0.00ms | +36.86% |
| min | 0.00ms | 0.00ms | +0.00ms | +21.64% |
| max | 0.01ms | 0.00ms | +0.00ms | +23.30% |
| total | 0.08ms | 0.06ms | +0.02ms | +36.86% |

### middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch)

# Perf Report — middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +14.12% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -0.18% |
| p99 | 0.03ms | 0.02ms | +0.00ms | +2.27% |
| mean | 0.02ms | 0.02ms | +0.00ms | +13.28% |
| min | 0.02ms | 0.02ms | +0.00ms | +14.09% |
| max | 0.03ms | 0.02ms | +0.00ms | +2.88% |
| total | 0.40ms | 0.35ms | +0.05ms | +13.28% |

### retry_recovery (5 flaky handler retry to success)

# Perf Report — retry_recovery (5 flaky handler retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.11ms |
| total | 0.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +7.12% |
| p95 | 0.04ms | 0.02ms | +0.02ms | +83.01% |
| p99 | 0.10ms | 0.03ms | +0.07ms | +217.32% |
| mean | 0.02ms | 0.02ms | +0.01ms | +35.12% |
| min | 0.01ms | 0.02ms | -0.00ms | -7.34% |
| max | 0.11ms | 0.03ms | +0.08ms | +243.38% |
| total | 0.49ms | 0.37ms | +0.13ms | +35.12% |

### concurrent_batch (5 batchInvoke of 4 procedures each)

# Perf Report — concurrent_batch (5 batchInvoke of 4 procedures each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.05ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -1.90% |
| p95 | 0.01ms | 0.02ms | -0.01ms | -28.64% |
| p99 | 0.05ms | 0.02ms | +0.03ms | +138.30% |
| mean | 0.01ms | 0.01ms | +0.00ms | +3.58% |
| min | 0.01ms | 0.01ms | +0.00ms | +9.68% |
| max | 0.05ms | 0.02ms | +0.03ms | +177.88% |
| total | 0.22ms | 0.21ms | +0.01ms | +3.58% |

