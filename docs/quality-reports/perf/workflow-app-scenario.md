# Perf Suite — workflow-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.0094ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.0072ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0094ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.05ms | 200ms | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.07ms | 200ms | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.11ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.12ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 9320 B | 0 B | 102400 B | yes | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 10240 B | 0 B | 102400 B | yes | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 3728 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | -255160 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 6752 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment)

# Perf Report — multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0094ms |
| p50 | 0.0098ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0041ms |
| min | 0.0093ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0094ms | 0.0098ms | -0.00037ms | -3.79% |
| p50 | 0.0098ms | 0.01ms | -0.0012ms | -11.15% |
| p95 | 0.02ms | 0.02ms | +0.00066ms | +3.22% |
| p99 | 0.02ms | 0.02ms | -0.0013ms | -5.59% |
| mean | 0.01ms | 0.01ms | -0.00091ms | -7.13% |
| min | 0.0093ms | 0.0097ms | -0.00042ms | -4.29% |
| max | 0.02ms | 0.02ms | -0.0018ms | -7.42% |
| total | 0.24ms | 0.26ms | -0.02ms | -7.13% |

### event_trigger_batch (5 event emits with 2 registered workflows each)

# Perf Report — event_trigger_batch (5 event emits with 2 registered workflows each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0072ms |
| p50 | 0.0089ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0049ms |
| min | 0.0072ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0072ms | 0.0074ms | -0.00016ms | -2.16% |
| p50 | 0.0089ms | 0.0084ms | +0.00050ms | +5.96% |
| p95 | 0.02ms | 0.02ms | +0.00091ms | +4.19% |
| p99 | 0.02ms | 0.02ms | +0.00022ms | +0.94% |
| mean | 0.01ms | 0.01ms | +0.00038ms | +3.56% |
| min | 0.0072ms | 0.0073ms | -0.000084ms | -1.16% |
| max | 0.02ms | 0.02ms | +0.000042ms | +0.18% |
| total | 0.22ms | 0.21ms | +0.0075ms | +3.56% |

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
| stdev | 0.0038ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0011ms | -4.81% |
| p50 | 0.02ms | 0.02ms | +0.00025ms | +1.09% |
| p95 | 0.03ms | 0.03ms | +0.00015ms | +0.47% |
| p99 | 0.03ms | 0.03ms | -0.00077ms | -2.29% |
| mean | 0.02ms | 0.02ms | -0.00017ms | -0.70% |
| min | 0.02ms | 0.02ms | -0.0015ms | -6.72% |
| max | 0.03ms | 0.03ms | -0.0010ms | -2.93% |
| total | 0.49ms | 0.49ms | -0.0034ms | -0.70% |

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
| stdev | 0.0029ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0017ms | +6.91% |
| p50 | 0.03ms | 0.03ms | +0.00039ms | +1.46% |
| p95 | 0.03ms | 0.03ms | +0.00068ms | +2.27% |
| p99 | 0.04ms | 0.03ms | +0.0034ms | +10.03% |
| mean | 0.03ms | 0.03ms | +0.00085ms | +3.09% |
| min | 0.03ms | 0.02ms | +0.0021ms | +8.85% |
| max | 0.04ms | 0.04ms | +0.0041ms | +11.68% |
| total | 0.56ms | 0.55ms | +0.02ms | +3.09% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0094ms |
| p50 | 0.0098ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0098ms |
| stdev | 0.00049ms |
| min | 0.0092ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0094ms | 0.0097ms | -0.00030ms | -3.09% |
| p50 | 0.0098ms | 0.01ms | -0.00035ms | -3.49% |
| p95 | 0.01ms | 0.01ms | -0.00095ms | -8.36% |
| p99 | 0.01ms | 0.01ms | -0.0015ms | -11.92% |
| mean | 0.0098ms | 0.01ms | -0.00059ms | -5.62% |
| min | 0.0092ms | 0.0097ms | -0.00042ms | -4.30% |
| max | 0.01ms | 0.01ms | -0.0017ms | -12.70% |
| total | 0.20ms | 0.21ms | -0.01ms | -5.62% |

