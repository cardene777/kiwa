# Perf Suite — workflow-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.0097ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.0068ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0092ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.05ms | 200ms | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.04ms | 200ms | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.11ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.17ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 1264 B | 0 B | 102400 B | yes | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 8864 B | 0 B | 102400 B | yes | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 3648 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | -128 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 409848 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment)

# Perf Report — multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0097ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0041ms |
| min | 0.0097ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0097ms | 0.0098ms | -0.000075ms | -0.76% |
| p50 | 0.01ms | 0.01ms | -0.00081ms | -7.38% |
| p95 | 0.02ms | 0.02ms | +0.00082ms | +3.99% |
| p99 | 0.02ms | 0.02ms | -0.0013ms | -5.46% |
| mean | 0.01ms | 0.01ms | -0.00069ms | -5.38% |
| min | 0.0097ms | 0.0097ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | -0.0018ms | -7.42% |
| total | 0.24ms | 0.26ms | -0.01ms | -5.38% |

### event_trigger_batch (5 event emits with 2 registered workflows each)

# Perf Report — event_trigger_batch (5 event emits with 2 registered workflows each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0068ms |
| p50 | 0.0080ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0049ms |
| min | 0.0067ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0068ms | 0.0074ms | -0.00058ms | -7.88% |
| p50 | 0.0080ms | 0.0084ms | -0.00035ms | -4.22% |
| p95 | 0.02ms | 0.02ms | -0.0024ms | -10.91% |
| p99 | 0.02ms | 0.02ms | -0.00051ms | -2.22% |
| mean | 0.01ms | 0.01ms | -0.00055ms | -5.15% |
| min | 0.0067ms | 0.0073ms | -0.00058ms | -8.06% |
| max | 0.02ms | 0.02ms | -0.000041ms | -0.18% |
| total | 0.20ms | 0.21ms | -0.01ms | -5.15% |

### retry_error_handling (5 fail-then-succeed with backoff)

# Perf Report — retry_error_handling (5 fail-then-succeed with backoff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.09ms |
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00053ms | -2.34% |
| p50 | 0.02ms | 0.02ms | +0.00085ms | +3.73% |
| p95 | 0.03ms | 0.03ms | -0.00015ms | -0.49% |
| p99 | 0.07ms | 0.03ms | +0.04ms | +122.41% |
| mean | 0.03ms | 0.02ms | +0.0030ms | +12.11% |
| min | 0.02ms | 0.02ms | -0.00075ms | -3.36% |
| max | 0.09ms | 0.03ms | +0.05ms | +150.85% |
| total | 0.55ms | 0.49ms | +0.06ms | +12.11% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.0023ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0013ms | +5.21% |
| p50 | 0.03ms | 0.03ms | -0.000084ms | -0.31% |
| p95 | 0.03ms | 0.03ms | +0.0015ms | +4.92% |
| p99 | 0.03ms | 0.03ms | +0.00050ms | +1.45% |
| mean | 0.03ms | 0.03ms | +0.00051ms | +1.85% |
| min | 0.03ms | 0.02ms | +0.0021ms | +8.85% |
| max | 0.04ms | 0.04ms | +0.00025ms | +0.71% |
| total | 0.56ms | 0.55ms | +0.01ms | +1.85% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0092ms |
| p50 | 0.0096ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0098ms |
| stdev | 0.00074ms |
| min | 0.0091ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0092ms | 0.0097ms | -0.00049ms | -5.10% |
| p50 | 0.0096ms | 0.01ms | -0.00054ms | -5.34% |
| p95 | 0.01ms | 0.01ms | -0.00083ms | -7.24% |
| p99 | 0.01ms | 0.01ms | -0.00073ms | -5.72% |
| mean | 0.0098ms | 0.01ms | -0.00066ms | -6.30% |
| min | 0.0091ms | 0.0097ms | -0.00058ms | -6.03% |
| max | 0.01ms | 0.01ms | -0.00071ms | -5.39% |
| total | 0.20ms | 0.21ms | -0.01ms | -6.30% |

