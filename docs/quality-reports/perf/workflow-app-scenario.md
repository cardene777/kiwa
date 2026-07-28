# Perf Suite — workflow-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2402%) 以上の悪化が必要) |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2264%) 以上の悪化が必要) |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.04ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1383%) 以上の悪化が必要) |
| retry_recovery (5 flaky async retry to success) | 0.04ms | 100ms | PASS | stable |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.02ms | 100ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.05ms | 200ms | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.09ms | 200ms | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.11ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | -478152 B | 0 B | 102400 B | yes | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 712 B | 0 B | 102400 B | yes | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 10496 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 7952 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | -15088 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.00ms | -29.92% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +2.67% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -28.31% |
| mean | 0.01ms | 0.02ms | -0.00ms | -24.74% |
| min | 0.01ms | 0.01ms | -0.00ms | -33.52% |
| max | 0.02ms | 0.04ms | -0.01ms | -32.76% |
| total | 0.25ms | 0.33ms | -0.08ms | -24.74% |

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
| p50 | 0.01ms | 0.01ms | +0.00ms | +6.00% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +2.17% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -38.41% |
| mean | 0.01ms | 0.01ms | -0.00ms | -0.64% |
| min | 0.01ms | 0.01ms | -0.00ms | -3.20% |
| max | 0.02ms | 0.04ms | -0.02ms | -43.57% |
| total | 0.24ms | 0.25ms | -0.00ms | -0.64% |

### retry_error_handling (5 fail-then-succeed with backoff)

# Perf Report — retry_error_handling (5 fail-then-succeed with backoff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -5.61% |
| p95 | 0.04ms | 0.04ms | -0.00ms | -0.12% |
| p99 | 0.04ms | 0.04ms | -0.00ms | -8.06% |
| mean | 0.02ms | 0.02ms | -0.00ms | -0.81% |
| min | 0.02ms | 0.02ms | +0.00ms | +7.33% |
| max | 0.04ms | 0.04ms | -0.00ms | -9.83% |
| total | 0.48ms | 0.49ms | -0.00ms | -0.81% |

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
| max | 0.05ms |
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -5.92% |
| p95 | 0.04ms | 10.36ms | -10.32ms | -99.63% |
| p99 | 0.04ms | 13.28ms | -13.23ms | -99.66% |
| mean | 0.03ms | 1.24ms | -1.21ms | -97.64% |
| min | 0.03ms | 0.03ms | +0.00ms | +3.81% |
| max | 0.05ms | 14.01ms | -13.96ms | -99.67% |
| total | 0.58ms | 24.71ms | -24.13ms | -97.64% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.02ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.01ms | +65.81% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +30.08% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +10.38% |
| mean | 0.02ms | 0.01ms | +0.01ms | +54.74% |
| min | 0.02ms | 0.01ms | +0.01ms | +72.72% |
| max | 0.02ms | 0.02ms | +0.00ms | +6.43% |
| total | 0.38ms | 0.24ms | +0.13ms | +54.74% |

