# Perf Suite — rust-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.03ms | 100ms | PASS | stable |
| middleware_chain_batch (5 tower layer chains) | 0.01ms | 100ms | PASS | regressed |
| route_error_handling (5 handler throw + catch) | 0.01ms | 100ms | PASS | stable |
| retry_recovery (5 flaky async retry to success) | 0.04ms | 100ms | PASS | n/a (baseline seeded) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.03ms | 100ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.02ms | 200ms | PASS |
| middleware_chain_batch (5 tower layer chains) | 0.03ms | 200ms | PASS |
| route_error_handling (5 handler throw + catch) | 0.08ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.20ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 42712 B | 0 B | 102400 B | PASS |
| middleware_chain_batch (5 tower layer chains) | 394976 B | 0 B | 102400 B | PASS |
| route_error_handling (5 handler throw + catch) | 247208 B | 0 B | 102400 B | PASS |
| retry_recovery (5 flaky async retry to success) | 557104 B | 0 B | 102400 B | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 660944 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### rest_handler_workflow (10 axum + actix + rocket mixed)

# Perf Report — rest_handler_workflow (10 axum + actix + rocket mixed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +0.34% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +42.58% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +4.29% |
| mean | 0.01ms | 0.01ms | +0.00ms | +7.19% |
| min | 0.00ms | 0.01ms | -0.00ms | -23.59% |
| max | 0.03ms | 0.03ms | -0.00ms | -1.57% |
| total | 0.19ms | 0.18ms | +0.01ms | +7.19% |

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
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +22.00% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +65.21% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +52.26% |
| mean | 0.01ms | 0.01ms | +0.00ms | +28.96% |
| min | 0.00ms | 0.00ms | -0.00ms | -6.75% |
| max | 0.01ms | 0.01ms | +0.00ms | +49.38% |
| total | 0.13ms | 0.10ms | +0.03ms | +28.96% |

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
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -5.08% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -7.19% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -23.39% |
| mean | 0.01ms | 0.01ms | -0.00ms | -7.87% |
| min | 0.01ms | 0.01ms | -0.00ms | -3.75% |
| max | 0.01ms | 0.02ms | -0.01ms | -26.48% |
| total | 0.24ms | 0.27ms | -0.02ms | -7.87% |

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
| total | 0.69ms |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.38ms |

