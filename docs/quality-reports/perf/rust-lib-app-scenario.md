# Perf Suite — rust-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2755%) 以上の悪化が必要) |
| middleware_chain_batch (5 tower layer chains) | 0.01ms | 100ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) |
| route_error_handling (5 handler throw + catch) | 0.02ms | 100ms | PASS | stable (差 0.01ms が下限 0.5ms 未満で判定を保留) |
| retry_recovery (5 flaky async retry to success) | 0.04ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1482%) 以上の悪化が必要) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3447%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.02ms | 200ms | PASS |
| middleware_chain_batch (5 tower layer chains) | 0.03ms | 200ms | PASS |
| route_error_handling (5 handler throw + catch) | 0.07ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.14ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 13160 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_batch (5 tower layer chains) | 5424 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 handler throw + catch) | 6016 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | -12488 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 2352 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -4.28% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +3.38% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -2.71% |
| mean | 0.01ms | 0.01ms | -0.00ms | -5.33% |
| min | 0.00ms | 0.01ms | -0.00ms | -30.07% |
| max | 0.03ms | 0.03ms | -0.00ms | -3.55% |
| total | 0.17ms | 0.18ms | -0.01ms | -5.33% |

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
| p50 | 0.01ms | 0.00ms | +0.00ms | +14.15% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +43.45% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +77.47% |
| mean | 0.01ms | 0.01ms | +0.00ms | +20.27% |
| min | 0.00ms | 0.00ms | -0.00ms | -5.20% |
| max | 0.01ms | 0.01ms | +0.01ms | +85.14% |
| total | 0.12ms | 0.10ms | +0.02ms | +20.27% |

### route_error_handling (5 handler throw + catch)

# Perf Report — route_error_handling (5 handler throw + catch).serial

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
| p50 | 0.01ms | 0.03ms | -0.02ms | -62.29% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -41.33% |
| p99 | 0.02ms | 0.05ms | -0.03ms | -57.15% |
| mean | 0.01ms | 0.03ms | -0.02ms | -60.32% |
| min | 0.01ms | 0.03ms | -0.02ms | -62.44% |
| max | 0.02ms | 0.06ms | -0.04ms | -59.44% |
| total | 0.25ms | 0.62ms | -0.37ms | -60.32% |

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
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +10.88% |
| p95 | 0.04ms | 0.03ms | +0.00ms | +6.48% |
| p99 | 0.04ms | 0.04ms | +0.00ms | +1.64% |
| mean | 0.03ms | 0.03ms | +0.00ms | +11.21% |
| min | 0.03ms | 0.02ms | +0.00ms | +10.47% |
| max | 0.04ms | 0.04ms | +0.00ms | +0.55% |
| total | 0.59ms | 0.53ms | +0.06ms | +11.21% |

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
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +3.31% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +34.58% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -14.70% |
| mean | 0.01ms | 0.01ms | +0.00ms | +7.14% |
| min | 0.01ms | 0.01ms | -0.00ms | -4.82% |
| max | 0.02ms | 0.03ms | -0.01ms | -21.26% |
| total | 0.26ms | 0.24ms | +0.02ms | +7.14% |

