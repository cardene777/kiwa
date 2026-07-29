# Perf Suite — workflow-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.0095ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.0071ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.02ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0092ms | 0.01ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.04ms | 200ms | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.05ms | 200ms | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.10ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | -141560 B | 0 B | 102400 B | yes | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 10128 B | 0 B | 102400 B | yes | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 3648 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 712 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 3384 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0041ms |
| min | 0.0095ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.0098ms | -0.00029ms | -2.94% |
| p50 | 0.01ms | 0.01ms | -0.0010ms | -9.07% |
| p95 | 0.02ms | 0.02ms | -0.0010ms | -4.89% |
| p99 | 0.02ms | 0.02ms | -0.00043ms | -1.82% |
| mean | 0.01ms | 0.01ms | -0.00067ms | -5.20% |
| min | 0.0095ms | 0.0097ms | -0.00025ms | -2.58% |
| max | 0.02ms | 0.02ms | -0.00029ms | -1.18% |
| total | 0.24ms | 0.26ms | -0.01ms | -5.20% |

### event_trigger_batch (5 event emits with 2 registered workflows each)

# Perf Report — event_trigger_batch (5 event emits with 2 registered workflows each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0071ms |
| p50 | 0.0084ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0043ms |
| min | 0.0066ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0071ms | 0.0074ms | -0.00024ms | -3.28% |
| p50 | 0.0084ms | 0.0084ms | 0.00ms | 0.00% |
| p95 | 0.02ms | 0.02ms | -0.0029ms | -13.21% |
| p99 | 0.02ms | 0.02ms | -0.0016ms | -7.16% |
| mean | 0.01ms | 0.01ms | -0.00022ms | -2.12% |
| min | 0.0066ms | 0.0073ms | -0.00063ms | -8.62% |
| max | 0.02ms | 0.02ms | -0.0013ms | -5.74% |
| total | 0.21ms | 0.21ms | -0.0045ms | -2.12% |

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
| total | 0.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00083ms | -3.71% |
| p50 | 0.02ms | 0.02ms | -0.00025ms | -1.09% |
| p95 | 0.03ms | 0.03ms | -0.0031ms | -9.69% |
| p99 | 0.03ms | 0.03ms | -0.0022ms | -6.48% |
| mean | 0.02ms | 0.02ms | -0.00060ms | -2.45% |
| min | 0.02ms | 0.02ms | -0.00087ms | -3.92% |
| max | 0.03ms | 0.03ms | -0.0020ms | -5.73% |
| total | 0.48ms | 0.49ms | -0.01ms | -2.45% |

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
| stdev | 0.0030ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00035ms | +1.41% |
| p50 | 0.03ms | 0.03ms | -0.0010ms | -3.85% |
| p95 | 0.03ms | 0.03ms | +0.0042ms | +13.93% |
| p99 | 0.04ms | 0.03ms | +0.0019ms | +5.46% |
| mean | 0.03ms | 0.03ms | -0.00043ms | -1.57% |
| min | 0.03ms | 0.02ms | +0.0011ms | +4.69% |
| max | 0.04ms | 0.04ms | +0.0013ms | +3.66% |
| total | 0.54ms | 0.55ms | -0.0086ms | -1.57% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0092ms |
| p50 | 0.0098ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.010ms |
| stdev | 0.00083ms |
| min | 0.0092ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0092ms | 0.0097ms | -0.00046ms | -4.72% |
| p50 | 0.0098ms | 0.01ms | -0.00033ms | -3.29% |
| p95 | 0.01ms | 0.01ms | -0.000037ms | -0.33% |
| p99 | 0.01ms | 0.01ms | -0.00061ms | -4.75% |
| mean | 0.010ms | 0.01ms | -0.00042ms | -4.04% |
| min | 0.0092ms | 0.0097ms | -0.00046ms | -4.74% |
| max | 0.01ms | 0.01ms | -0.00075ms | -5.71% |
| total | 0.20ms | 0.21ms | -0.0084ms | -4.04% |

