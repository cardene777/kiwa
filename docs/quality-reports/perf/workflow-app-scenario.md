# Perf Suite — workflow-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.03ms | 100ms | PASS | stable |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.02ms | 100ms | PASS | stable |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.03ms | 100ms | PASS | stable |
| retry_recovery (5 flaky async retry to success) | 0.04ms | 100ms | PASS | stable |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.05ms | 200ms | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.06ms | 200ms | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.12ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.14ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 2008 B | 0 B | 102400 B | yes | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 296856 B | 0 B | 102400 B | yes | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 3640 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 9280 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 1296 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment)

# Perf Report — multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.04ms | -0.03ms | -70.62% |
| p95 | 0.03ms | 0.06ms | -0.04ms | -60.17% |
| p99 | 0.03ms | 0.20ms | -0.17ms | -86.90% |
| mean | 0.01ms | 0.05ms | -0.03ms | -72.58% |
| min | 0.01ms | 0.03ms | -0.02ms | -71.99% |
| max | 0.03ms | 0.23ms | -0.20ms | -88.75% |
| total | 0.26ms | 0.93ms | -0.68ms | -72.58% |

### event_trigger_batch (5 event emits with 2 registered workflows each)

# Perf Report — event_trigger_batch (5 event emits with 2 registered workflows each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +30.15% |
| p95 | 0.02ms | 0.02ms | +0.01ms | +27.96% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +31.72% |
| mean | 0.01ms | 0.01ms | +0.00ms | +32.14% |
| min | 0.01ms | 0.01ms | +0.00ms | +20.86% |
| max | 0.03ms | 0.02ms | +0.01ms | +32.63% |
| total | 0.28ms | 0.21ms | +0.07ms | +32.14% |

### retry_error_handling (5 fail-then-succeed with backoff)

# Perf Report — retry_error_handling (5 fail-then-succeed with backoff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.02ms | +0.00ms | +8.07% |
| p95 | 0.03ms | 0.10ms | -0.06ms | -67.44% |
| p99 | 0.03ms | 0.29ms | -0.26ms | -88.28% |
| mean | 0.03ms | 0.05ms | -0.02ms | -42.80% |
| min | 0.03ms | 0.02ms | +0.01ms | +28.12% |
| max | 0.04ms | 0.34ms | -0.31ms | -89.75% |
| total | 0.54ms | 0.94ms | -0.40ms | -42.80% |

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
| total | 0.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.01ms | +26.77% |
| p95 | 0.04ms | 0.03ms | +0.01ms | +19.92% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +27.74% |
| mean | 0.03ms | 0.03ms | +0.01ms | +27.93% |
| min | 0.03ms | 0.02ms | +0.01ms | +33.87% |
| max | 0.04ms | 0.03ms | +0.01ms | +29.64% |
| total | 0.67ms | 0.52ms | +0.15ms | +27.93% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

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
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -8.47% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -21.50% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -13.18% |
| mean | 0.01ms | 0.01ms | -0.00ms | -10.50% |
| min | 0.01ms | 0.01ms | -0.00ms | -6.43% |
| max | 0.02ms | 0.02ms | -0.00ms | -11.36% |
| total | 0.22ms | 0.24ms | -0.03ms | -10.50% |

