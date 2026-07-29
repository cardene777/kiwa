# Perf Suite — workflow-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.0095ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.0070ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.02ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0092ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.06ms | 200ms | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.04ms | 200ms | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.10ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.12ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 4112 B | 0 B | 102400 B | yes | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 10240 B | 0 B | 102400 B | yes | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 3648 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 712 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 3160 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment)

# Perf Report — multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0095ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0044ms |
| min | 0.0095ms |
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.0098ms | -0.00024ms | -2.47% |
| p50 | 0.01ms | 0.01ms | -0.00081ms | -7.37% |
| p95 | 0.02ms | 0.02ms | +0.0024ms | +11.76% |
| p99 | 0.02ms | 0.02ms | -0.00012ms | -0.48% |
| mean | 0.01ms | 0.01ms | -0.00019ms | -1.48% |
| min | 0.0095ms | 0.0097ms | -0.00025ms | -2.58% |
| max | 0.02ms | 0.02ms | -0.00075ms | -3.03% |
| total | 0.25ms | 0.26ms | -0.0038ms | -1.48% |

### event_trigger_batch (5 event emits with 2 registered workflows each)

# Perf Report — event_trigger_batch (5 event emits with 2 registered workflows each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0070ms |
| p50 | 0.0078ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0097ms |
| stdev | 0.0041ms |
| min | 0.0069ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0070ms | 0.0074ms | -0.00037ms | -5.04% |
| p50 | 0.0078ms | 0.0084ms | -0.00056ms | -6.70% |
| p95 | 0.02ms | 0.02ms | -0.0035ms | -16.22% |
| p99 | 0.02ms | 0.02ms | -0.0028ms | -12.10% |
| mean | 0.0097ms | 0.01ms | -0.00089ms | -8.41% |
| min | 0.0069ms | 0.0073ms | -0.00033ms | -4.59% |
| max | 0.02ms | 0.02ms | -0.0026ms | -11.13% |
| total | 0.19ms | 0.21ms | -0.02ms | -8.41% |

### retry_error_handling (5 fail-then-succeed with backoff)

# Perf Report — retry_error_handling (5 fail-then-succeed with backoff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0050ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00098ms | -4.36% |
| p50 | 0.02ms | 0.02ms | -0.0010ms | -4.54% |
| p95 | 0.03ms | 0.03ms | +0.00041ms | +1.29% |
| p99 | 0.04ms | 0.03ms | +0.0060ms | +17.77% |
| mean | 0.02ms | 0.02ms | -0.00056ms | -2.28% |
| min | 0.02ms | 0.02ms | -0.0014ms | -6.34% |
| max | 0.04ms | 0.03ms | +0.0074ms | +21.59% |
| total | 0.48ms | 0.49ms | -0.01ms | -2.28% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0027ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00078ms | +3.11% |
| p50 | 0.03ms | 0.03ms | -0.00071ms | -2.62% |
| p95 | 0.03ms | 0.03ms | +0.00093ms | +3.09% |
| p99 | 0.04ms | 0.03ms | +0.0018ms | +5.11% |
| mean | 0.03ms | 0.03ms | +0.000037ms | +0.14% |
| min | 0.03ms | 0.02ms | +0.0017ms | +6.95% |
| max | 0.04ms | 0.04ms | +0.0020ms | +5.54% |
| total | 0.55ms | 0.55ms | +0.00075ms | +0.14% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0092ms |
| p50 | 0.0095ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0097ms |
| stdev | 0.00048ms |
| min | 0.0092ms |
| max | 0.01ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0092ms | 0.0097ms | -0.00045ms | -4.68% |
| p50 | 0.0095ms | 0.01ms | -0.00065ms | -6.37% |
| p95 | 0.01ms | 0.01ms | -0.00078ms | -6.82% |
| p99 | 0.01ms | 0.01ms | -0.0019ms | -14.52% |
| mean | 0.0097ms | 0.01ms | -0.00077ms | -7.36% |
| min | 0.0092ms | 0.0097ms | -0.00050ms | -5.17% |
| max | 0.01ms | 0.01ms | -0.0021ms | -16.19% |
| total | 0.19ms | 0.21ms | -0.02ms | -7.36% |

