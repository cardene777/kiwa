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
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.05ms | 200ms | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.05ms | 200ms | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.11ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.12ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 6600 B | 0 B | 102400 B | yes | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 9000 B | 0 B | 102400 B | yes | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 9656 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 9280 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | -14536 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.04ms | -0.02ms | -60.34% |
| p95 | 0.02ms | 0.06ms | -0.04ms | -68.00% |
| p99 | 0.02ms | 0.20ms | -0.17ms | -88.52% |
| mean | 0.01ms | 0.05ms | -0.03ms | -70.72% |
| min | 0.01ms | 0.03ms | -0.02ms | -71.39% |
| max | 0.02ms | 0.23ms | -0.21ms | -89.93% |
| total | 0.27ms | 0.93ms | -0.66ms | -70.72% |

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
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +21.08% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +25.49% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +28.01% |
| mean | 0.01ms | 0.01ms | +0.00ms | +24.71% |
| min | 0.01ms | 0.01ms | +0.00ms | +6.17% |
| max | 0.03ms | 0.02ms | +0.01ms | +28.63% |
| total | 0.26ms | 0.21ms | +0.05ms | +24.71% |

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
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -6.35% |
| p95 | 0.03ms | 0.10ms | -0.07ms | -68.12% |
| p99 | 0.03ms | 0.29ms | -0.26ms | -89.54% |
| mean | 0.02ms | 0.05ms | -0.02ms | -49.87% |
| min | 0.02ms | 0.02ms | +0.00ms | +9.58% |
| max | 0.03ms | 0.34ms | -0.31ms | -91.04% |
| total | 0.47ms | 0.94ms | -0.47ms | -49.87% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

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
| max | 0.03ms |
| total | 0.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +9.47% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +1.80% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +8.08% |
| mean | 0.03ms | 0.03ms | +0.00ms | +10.03% |
| min | 0.03ms | 0.02ms | +0.00ms | +15.07% |
| max | 0.03ms | 0.03ms | +0.00ms | +9.61% |
| total | 0.57ms | 0.52ms | +0.05ms | +10.03% |

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
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +5.90% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -20.42% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -21.22% |
| mean | 0.01ms | 0.01ms | -0.00ms | -0.03% |
| min | 0.01ms | 0.01ms | +0.00ms | +11.24% |
| max | 0.01ms | 0.02ms | -0.00ms | -21.40% |
| total | 0.24ms | 0.24ms | -0.00ms | -0.03% |

