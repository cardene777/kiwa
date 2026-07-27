# Perf Suite — rust-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.02ms | 100ms | PASS | stable |
| middleware_chain_batch (5 tower layer chains) | 0.01ms | 100ms | PASS | stable |
| route_error_handling (5 handler throw + catch) | 0.01ms | 100ms | PASS | stable |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 100ms | PASS | stable |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.02ms | 200ms | PASS |
| middleware_chain_batch (5 tower layer chains) | 0.03ms | 200ms | PASS |
| route_error_handling (5 handler throw + catch) | 0.07ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 12056 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_batch (5 tower layer chains) | 12480 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 handler throw + catch) | 1504 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 10952 B | 0 B | 102400 B | yes | PASS |
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
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | 0.00ms | 0.00% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +14.73% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -0.46% |
| mean | 0.01ms | 0.01ms | -0.00ms | -5.96% |
| min | 0.00ms | 0.00ms | -0.00ms | -1.01% |
| max | 0.03ms | 0.03ms | -0.00ms | -2.65% |
| total | 0.16ms | 0.17ms | -0.01ms | -5.96% |

### middleware_chain_batch (5 tower layer chains)

# Perf Report — middleware_chain_batch (5 tower layer chains).serial

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
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -11.48% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +21.87% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +23.08% |
| mean | 0.00ms | 0.00ms | -0.00ms | -5.87% |
| min | 0.00ms | 0.00ms | -0.00ms | -22.86% |
| max | 0.01ms | 0.01ms | +0.00ms | +23.33% |
| total | 0.09ms | 0.09ms | -0.01ms | -5.87% |

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
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -2.69% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -15.02% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -19.55% |
| mean | 0.01ms | 0.01ms | -0.00ms | -6.27% |
| min | 0.01ms | 0.01ms | -0.00ms | -0.77% |
| max | 0.01ms | 0.02ms | -0.00ms | -20.57% |
| total | 0.23ms | 0.24ms | -0.02ms | -6.27% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -2.67% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +0.87% |
| p99 | 0.04ms | 0.04ms | +0.00ms | +2.81% |
| mean | 0.03ms | 0.03ms | -0.00ms | -3.85% |
| min | 0.03ms | 0.03ms | -0.00ms | -3.72% |
| max | 0.04ms | 0.04ms | +0.00ms | +3.26% |
| total | 0.57ms | 0.59ms | -0.02ms | -3.85% |

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
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -5.16% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -11.70% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -8.79% |
| mean | 0.01ms | 0.01ms | -0.00ms | -6.44% |
| min | 0.01ms | 0.01ms | +0.00ms | +0.88% |
| max | 0.02ms | 0.02ms | -0.00ms | -8.19% |
| total | 0.22ms | 0.23ms | -0.01ms | -6.44% |

