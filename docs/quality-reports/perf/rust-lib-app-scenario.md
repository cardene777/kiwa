# Perf Suite — rust-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.02ms | 100ms | PASS | stable |
| middleware_chain_batch (5 tower layer chains) | 0.01ms | 100ms | PASS | stable |
| route_error_handling (5 handler throw + catch) | 0.01ms | 100ms | PASS | stable |
| retry_recovery (5 flaky async retry to success) | 0.04ms | 100ms | PASS | stable |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.02ms | 200ms | PASS |
| middleware_chain_batch (5 tower layer chains) | 0.03ms | 200ms | PASS |
| route_error_handling (5 handler throw + catch) | 0.07ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.14ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 6024 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_batch (5 tower layer chains) | 12480 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 handler throw + catch) | -400 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 12608 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | -14456 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_handler_workflow (10 axum + actix + rocket mixed)

# Perf Report — rest_handler_workflow (10 axum + actix + rocket mixed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +10.15% |
| p95 | 0.02ms | 0.02ms | +0.01ms | +42.91% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +11.27% |
| mean | 0.01ms | 0.01ms | +0.00ms | +11.29% |
| min | 0.00ms | 0.00ms | +0.00ms | +12.37% |
| max | 0.03ms | 0.03ms | +0.00ms | +6.70% |
| total | 0.19ms | 0.17ms | +0.02ms | +11.29% |

### middleware_chain_batch (5 tower layer chains)

# Perf Report — middleware_chain_batch (5 tower layer chains).serial

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
| p50 | 0.01ms | 0.00ms | +0.00ms | +23.39% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +47.95% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +63.44% |
| mean | 0.01ms | 0.00ms | +0.00ms | +27.58% |
| min | 0.00ms | 0.00ms | +0.00ms | +12.37% |
| max | 0.01ms | 0.01ms | +0.00ms | +66.67% |
| total | 0.12ms | 0.09ms | +0.03ms | +27.58% |

### route_error_handling (5 handler throw + catch)

# Perf Report — route_error_handling (5 handler throw + catch).serial

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
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +8.96% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -3.09% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -10.12% |
| mean | 0.01ms | 0.01ms | +0.00ms | +5.79% |
| min | 0.01ms | 0.01ms | +0.00ms | +12.21% |
| max | 0.01ms | 0.02ms | -0.00ms | -11.72% |
| total | 0.26ms | 0.24ms | +0.01ms | +5.79% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

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
| total | 0.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +12.70% |
| p95 | 0.04ms | 0.03ms | +0.01ms | +19.06% |
| p99 | 0.04ms | 0.04ms | +0.01ms | +18.12% |
| mean | 0.03ms | 0.03ms | +0.00ms | +12.28% |
| min | 0.03ms | 0.03ms | +0.00ms | +12.38% |
| max | 0.04ms | 0.04ms | +0.01ms | +17.91% |
| total | 0.66ms | 0.59ms | +0.07ms | +12.28% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

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
| p50 | 0.01ms | 0.01ms | +0.00ms | +8.56% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -0.28% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +2.43% |
| mean | 0.01ms | 0.01ms | +0.00ms | +7.41% |
| min | 0.01ms | 0.01ms | +0.00ms | +14.97% |
| max | 0.02ms | 0.02ms | +0.00ms | +2.99% |
| total | 0.25ms | 0.23ms | +0.02ms | +7.41% |

