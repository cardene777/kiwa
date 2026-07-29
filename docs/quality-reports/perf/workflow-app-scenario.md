# Perf Suite — workflow-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2402%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2264%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.04ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1383%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 100ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3318%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.06ms | 200ms | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.05ms | 200ms | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.12ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.15ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 9968 B | 0 B | 102400 B | yes | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 9696 B | 0 B | 102400 B | yes | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 15816 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 4712 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 6056 B | 0 B | 102400 B | yes | PASS |

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
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.00ms | -1.25% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +31.45% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -6.81% |
| mean | 0.02ms | 0.02ms | +0.00ms | +0.66% |
| min | 0.01ms | 0.01ms | -0.00ms | -22.16% |
| max | 0.03ms | 0.04ms | -0.00ms | -12.30% |
| total | 0.33ms | 0.33ms | +0.00ms | +0.66% |

### event_trigger_batch (5 event emits with 2 registered workflows each)

# Perf Report — event_trigger_batch (5 event emits with 2 registered workflows each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +24.84% |
| p95 | 0.03ms | 0.02ms | +0.00ms | +14.74% |
| p99 | 0.03ms | 0.04ms | -0.01ms | -23.79% |
| mean | 0.01ms | 0.01ms | +0.00ms | +13.40% |
| min | 0.01ms | 0.01ms | +0.00ms | +17.89% |
| max | 0.03ms | 0.04ms | -0.01ms | -28.69% |
| total | 0.28ms | 0.25ms | +0.03ms | +13.40% |

### retry_error_handling (5 fail-then-succeed with backoff)

# Perf Report — retry_error_handling (5 fail-then-succeed with backoff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -0.70% |
| p95 | 0.04ms | 0.04ms | +0.00ms | +6.51% |
| p99 | 0.05ms | 0.04ms | +0.01ms | +14.58% |
| mean | 0.03ms | 0.02ms | +0.00ms | +4.57% |
| min | 0.02ms | 0.02ms | -0.00ms | -0.82% |
| max | 0.05ms | 0.04ms | +0.01ms | +16.38% |
| total | 0.51ms | 0.49ms | +0.02ms | +4.57% |

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
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +0.71% |
| p95 | 0.03ms | 10.36ms | -10.33ms | -99.66% |
| p99 | 0.04ms | 13.28ms | -13.24ms | -99.73% |
| mean | 0.03ms | 1.24ms | -1.21ms | -97.54% |
| min | 0.03ms | 0.03ms | +0.00ms | +12.60% |
| max | 0.04ms | 14.01ms | -13.97ms | -99.74% |
| total | 0.61ms | 24.71ms | -24.10ms | -97.54% |

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
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -4.62% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -17.54% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -26.76% |
| mean | 0.01ms | 0.01ms | -0.00ms | -8.53% |
| min | 0.01ms | 0.01ms | -0.00ms | -1.58% |
| max | 0.01ms | 0.02ms | -0.01ms | -28.60% |
| total | 0.22ms | 0.24ms | -0.02ms | -8.53% |

