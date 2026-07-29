# Perf Suite — rust-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.04ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2755%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| middleware_chain_batch (5 tower layer chains) | 0.01ms | 100ms | PASS | stable (差 0.01ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| route_error_handling (5 handler throw + catch) | 0.14ms | 100ms | PASS | stable (差 0.11ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.04ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1482%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3447%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.02ms | 200ms | PASS |
| middleware_chain_batch (5 tower layer chains) | 0.03ms | 200ms | PASS |
| route_error_handling (5 handler throw + catch) | 0.22ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.12ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.24ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 11552 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_batch (5 tower layer chains) | 5376 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 handler throw + catch) | 648 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 3816 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | -13840 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_handler_workflow (10 axum + actix + rocket mixed)

# Perf Report — rest_handler_workflow (10 axum + actix + rocket mixed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.11ms |
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.01ms | +95.36% |
| p95 | 0.04ms | 0.02ms | +0.02ms | +117.62% |
| p99 | 0.09ms | 0.03ms | +0.06ms | +211.73% |
| mean | 0.02ms | 0.01ms | +0.01ms | +126.27% |
| min | 0.01ms | 0.01ms | +0.00ms | +84.23% |
| max | 0.11ms | 0.03ms | +0.07ms | +224.71% |
| total | 0.40ms | 0.18ms | +0.23ms | +126.27% |

### middleware_chain_batch (5 tower layer chains)

# Perf Report — middleware_chain_batch (5 tower layer chains).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.07ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +39.05% |
| p95 | 0.01ms | 0.01ms | +0.01ms | +114.08% |
| p99 | 0.06ms | 0.01ms | +0.05ms | +810.06% |
| mean | 0.01ms | 0.01ms | +0.00ms | +98.22% |
| min | 0.01ms | 0.00ms | +0.00ms | +14.80% |
| max | 0.07ms | 0.01ms | +0.06ms | +966.99% |
| total | 0.20ms | 0.10ms | +0.10ms | +98.22% |

### route_error_handling (5 handler throw + catch)

# Perf Report — route_error_handling (5 handler throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.14ms |
| p99 | 0.26ms |
| mean | 0.05ms |
| stdev | 0.06ms |
| min | 0.03ms |
| max | 0.28ms |
| total | 1.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +15.72% |
| p95 | 0.14ms | 0.03ms | +0.11ms | +310.44% |
| p99 | 0.26ms | 0.05ms | +0.20ms | +366.51% |
| mean | 0.05ms | 0.03ms | +0.02ms | +74.87% |
| min | 0.03ms | 0.03ms | +0.00ms | +1.48% |
| max | 0.28ms | 0.06ms | +0.22ms | +374.64% |
| total | 1.09ms | 0.62ms | +0.46ms | +74.87% |

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
| total | 0.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.01ms | +21.10% |
| p95 | 0.04ms | 0.03ms | +0.01ms | +16.19% |
| p99 | 0.04ms | 0.04ms | +0.00ms | +8.22% |
| mean | 0.03ms | 0.03ms | +0.01ms | +20.17% |
| min | 0.03ms | 0.02ms | +0.00ms | +17.28% |
| max | 0.04ms | 0.04ms | +0.00ms | +6.43% |
| total | 0.64ms | 0.53ms | +0.11ms | +20.17% |

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
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +3.13% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +36.95% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -12.66% |
| mean | 0.01ms | 0.01ms | +0.00ms | +11.06% |
| min | 0.01ms | 0.01ms | +0.00ms | +0.40% |
| max | 0.02ms | 0.03ms | -0.01ms | -19.27% |
| total | 0.27ms | 0.24ms | +0.03ms | +11.06% |

