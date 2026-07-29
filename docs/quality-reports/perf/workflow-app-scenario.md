# Perf Suite — workflow-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.0098ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.0071ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.02ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0094ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.04ms | 200ms | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.04ms | 200ms | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.10ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.12ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 2864 B | 0 B | 102400 B | yes | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 10144 B | 0 B | 102400 B | yes | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 3648 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | -408 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 872 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment)

# Perf Report — multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0098ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0036ms |
| min | 0.0097ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0098ms | 0.0098ms | +0.0000032ms | +0.03% |
| p50 | 0.01ms | 0.01ms | -0.00067ms | -6.05% |
| p95 | 0.02ms | 0.02ms | -0.0021ms | -10.19% |
| p99 | 0.02ms | 0.02ms | -0.0016ms | -6.78% |
| mean | 0.01ms | 0.01ms | -0.00079ms | -6.20% |
| min | 0.0097ms | 0.0097ms | -0.000042ms | -0.43% |
| max | 0.02ms | 0.02ms | -0.0015ms | -6.07% |
| total | 0.24ms | 0.26ms | -0.02ms | -6.20% |

### event_trigger_batch (5 event emits with 2 registered workflows each)

# Perf Report — event_trigger_batch (5 event emits with 2 registered workflows each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0071ms |
| p50 | 0.0081ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0048ms |
| min | 0.0069ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0071ms | 0.0074ms | -0.00025ms | -3.34% |
| p50 | 0.0081ms | 0.0084ms | -0.00031ms | -3.73% |
| p95 | 0.02ms | 0.02ms | +0.00016ms | +0.72% |
| p99 | 0.02ms | 0.02ms | -0.00064ms | -2.77% |
| mean | 0.01ms | 0.01ms | -0.00044ms | -4.13% |
| min | 0.0069ms | 0.0073ms | -0.00033ms | -4.59% |
| max | 0.02ms | 0.02ms | -0.00083ms | -3.59% |
| total | 0.20ms | 0.21ms | -0.0087ms | -4.13% |

### retry_error_handling (5 fail-then-succeed with backoff)

# Perf Report — retry_error_handling (5 fail-then-succeed with backoff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0028ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00021ms | +0.95% |
| p50 | 0.02ms | 0.02ms | +0.00048ms | +2.09% |
| p95 | 0.03ms | 0.03ms | -0.0019ms | -6.10% |
| p99 | 0.03ms | 0.03ms | -0.00085ms | -2.53% |
| mean | 0.02ms | 0.02ms | +0.00031ms | +1.29% |
| min | 0.02ms | 0.02ms | +0.00029ms | +1.31% |
| max | 0.03ms | 0.03ms | -0.00058ms | -1.71% |
| total | 0.50ms | 0.49ms | +0.0063ms | +1.29% |

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
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00090ms | +3.58% |
| p50 | 0.03ms | 0.03ms | -0.00035ms | -1.31% |
| p95 | 0.03ms | 0.03ms | +0.0011ms | +3.61% |
| p99 | 0.03ms | 0.03ms | +0.00045ms | +1.31% |
| mean | 0.03ms | 0.03ms | +1.0e-7ms | +0.00% |
| min | 0.03ms | 0.02ms | +0.0018ms | +7.64% |
| max | 0.04ms | 0.04ms | +0.00029ms | +0.83% |
| total | 0.55ms | 0.55ms | +0.0000020ms | +0.00% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0094ms |
| p50 | 0.0096ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0098ms |
| stdev | 0.00055ms |
| min | 0.0092ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0094ms | 0.0097ms | -0.00033ms | -3.39% |
| p50 | 0.0096ms | 0.01ms | -0.00054ms | -5.34% |
| p95 | 0.01ms | 0.01ms | -0.00090ms | -7.89% |
| p99 | 0.01ms | 0.01ms | -0.0013ms | -10.28% |
| mean | 0.0098ms | 0.01ms | -0.00065ms | -6.22% |
| min | 0.0092ms | 0.0097ms | -0.00046ms | -4.73% |
| max | 0.01ms | 0.01ms | -0.0014ms | -10.80% |
| total | 0.20ms | 0.21ms | -0.01ms | -6.22% |

