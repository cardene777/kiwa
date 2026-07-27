# Perf Suite — workflow-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.02ms | 100ms | PASS | stable |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.02ms | 100ms | PASS | stable |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.03ms | 100ms | PASS | stable |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 100ms | PASS | stable |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.04ms | 200ms | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.05ms | 200ms | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.11ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.12ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 1792 B | 0 B | 102400 B | yes | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 144 B | 0 B | 102400 B | yes | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 8552 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 9280 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 1200 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment)

# Perf Report — multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment).serial

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
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.04ms | -0.03ms | -71.15% |
| p95 | 0.02ms | 0.06ms | -0.04ms | -69.87% |
| p99 | 0.02ms | 0.20ms | -0.18ms | -89.55% |
| mean | 0.01ms | 0.05ms | -0.03ms | -74.53% |
| min | 0.01ms | 0.03ms | -0.02ms | -71.76% |
| max | 0.02ms | 0.23ms | -0.21ms | -90.91% |
| total | 0.24ms | 0.93ms | -0.70ms | -74.53% |

### event_trigger_batch (5 event emits with 2 registered workflows each)

# Perf Report — event_trigger_batch (5 event emits with 2 registered workflows each).serial

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
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +16.55% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +9.47% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +8.63% |
| mean | 0.01ms | 0.01ms | +0.00ms | +16.37% |
| min | 0.01ms | 0.01ms | +0.00ms | +3.32% |
| max | 0.02ms | 0.02ms | +0.00ms | +8.42% |
| total | 0.24ms | 0.21ms | +0.03ms | +16.37% |

### retry_error_handling (5 fail-then-succeed with backoff)

# Perf Report — retry_error_handling (5 fail-then-succeed with backoff).serial

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
| total | 0.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -1.46% |
| p95 | 0.03ms | 0.10ms | -0.07ms | -71.73% |
| p99 | 0.03ms | 0.29ms | -0.26ms | -89.03% |
| mean | 0.02ms | 0.05ms | -0.02ms | -48.20% |
| min | 0.02ms | 0.02ms | +0.00ms | +9.37% |
| max | 0.03ms | 0.34ms | -0.31ms | -90.25% |
| total | 0.49ms | 0.94ms | -0.45ms | -48.20% |

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
| p50 | 0.03ms | 0.03ms | +0.00ms | +8.41% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +3.20% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +18.14% |
| mean | 0.03ms | 0.03ms | +0.00ms | +9.02% |
| min | 0.03ms | 0.02ms | +0.00ms | +13.83% |
| max | 0.04ms | 0.03ms | +0.01ms | +21.76% |
| total | 0.57ms | 0.52ms | +0.05ms | +9.02% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

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
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -13.07% |
| p95 | 0.01ms | 0.02ms | -0.01ms | -32.60% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -28.25% |
| mean | 0.01ms | 0.01ms | -0.00ms | -16.47% |
| min | 0.01ms | 0.01ms | -0.00ms | -8.03% |
| max | 0.01ms | 0.02ms | -0.01ms | -27.30% |
| total | 0.20ms | 0.24ms | -0.04ms | -16.47% |

