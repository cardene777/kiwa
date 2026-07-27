# Perf Suite — workflow-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.03ms | 100ms | PASS | stable |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.04ms | 100ms | PASS | regressed |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.03ms | 100ms | PASS | stable |
| retry_recovery (5 flaky async retry to success) | 0.15ms | 100ms | PASS | n/a (baseline seeded) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.03ms | 100ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.53ms | 200ms | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.05ms | 200ms | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.09ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.88ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.21ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 1261168 B | 0 B | 102400 B | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 608912 B | 0 B | 102400 B | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 1173960 B | 0 B | 102400 B | PASS |
| retry_recovery (5 flaky async retry to success) | 766280 B | 0 B | 102400 B | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 661392 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment)

# Perf Report — multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment).serial

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
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.01ms | +49.08% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +27.50% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -2.78% |
| mean | 0.02ms | 0.01ms | +0.00ms | +29.31% |
| min | 0.01ms | 0.01ms | +0.00ms | +47.05% |
| max | 0.03ms | 0.03ms | -0.00ms | -7.84% |
| total | 0.33ms | 0.26ms | +0.08ms | +29.31% |

### event_trigger_batch (5 event emits with 2 registered workflows each)

# Perf Report — event_trigger_batch (5 event emits with 2 registered workflows each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +16.94% |
| p95 | 0.04ms | 0.02ms | +0.02ms | +104.53% |
| p99 | 0.04ms | 0.02ms | +0.02ms | +105.79% |
| mean | 0.02ms | 0.01ms | +0.01ms | +54.61% |
| min | 0.01ms | 0.01ms | +0.00ms | +25.86% |
| max | 0.05ms | 0.02ms | +0.02ms | +106.09% |
| total | 0.36ms | 0.24ms | +0.13ms | +54.61% |

### retry_error_handling (5 fail-then-succeed with backoff)

# Perf Report — retry_error_handling (5 fail-then-succeed with backoff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -4.73% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +8.12% |
| p99 | 0.04ms | 0.03ms | +0.00ms | +10.43% |
| mean | 0.02ms | 0.02ms | -0.00ms | -2.78% |
| min | 0.02ms | 0.02ms | -0.00ms | -14.53% |
| max | 0.04ms | 0.03ms | +0.00ms | +10.96% |
| total | 0.48ms | 0.49ms | -0.01ms | -2.78% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.08ms |
| p95 | 0.15ms |
| p99 | 0.16ms |
| mean | 0.08ms |
| stdev | 0.04ms |
| min | 0.03ms |
| max | 0.16ms |
| total | 1.63ms |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.10ms |
| total | 0.39ms |

