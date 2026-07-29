# Perf Suite — workflow-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00058ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.01ms | 0.03ms | 100ms | 0.00058ms | PASS | stable (p10 +15% (閾値未満)、 p95 +36% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.01ms | 0.02ms | 100ms | 0.00058ms | PASS | regressed — gate 無効 (regressionGate=false) |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.02ms | 0.03ms | 100ms | 0.00058ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.02ms | 0.03ms | 100ms | 0.00058ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 0.02ms | 100ms | 0.00058ms | PASS | stable (p10 +3% (閾値未満)、 p95 +47% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.07ms | 200ms | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.05ms | 200ms | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.11ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.14ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.12ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 42024 B | -14735 B | 102400 B | yes | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 34792 B | 0 B | 102400 B | yes | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 9824 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 5568 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 14088 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment)

# Perf Report — multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0047ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0098ms | +0.0015ms | +15.37% |
| p50 | 0.02ms | 0.01ms | +0.0050ms | +45.74% |
| p95 | 0.03ms | 0.02ms | +0.0073ms | +35.56% |
| p99 | 0.03ms | 0.02ms | +0.0044ms | +18.41% |
| mean | 0.02ms | 0.01ms | +0.0033ms | +25.99% |
| min | 0.01ms | 0.0097ms | +0.0015ms | +15.88% |
| max | 0.03ms | 0.02ms | +0.0037ms | +14.84% |
| total | 0.32ms | 0.26ms | +0.07ms | +25.99% |

### event_trigger_batch (5 event emits with 2 registered workflows each)

# Perf Report — event_trigger_batch (5 event emits with 2 registered workflows each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0032ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0074ms | +0.0038ms | +52.01% |
| p50 | 0.01ms | 0.0084ms | +0.0035ms | +42.17% |
| p95 | 0.02ms | 0.02ms | -0.0019ms | -8.57% |
| p99 | 0.02ms | 0.02ms | -0.0017ms | -7.59% |
| mean | 0.01ms | 0.01ms | +0.0026ms | +24.50% |
| min | 0.01ms | 0.0073ms | +0.0029ms | +39.66% |
| max | 0.02ms | 0.02ms | -0.0017ms | -7.36% |
| total | 0.26ms | 0.21ms | +0.05ms | +24.50% |

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
| stdev | 0.0041ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0011ms | -4.85% |
| p50 | 0.02ms | 0.02ms | +0.00056ms | +2.46% |
| p95 | 0.03ms | 0.03ms | -0.0022ms | -6.98% |
| p99 | 0.04ms | 0.03ms | +0.0035ms | +10.47% |
| mean | 0.02ms | 0.02ms | +0.00022ms | +0.89% |
| min | 0.02ms | 0.02ms | -0.0012ms | -5.23% |
| max | 0.04ms | 0.03ms | +0.0050ms | +14.51% |
| total | 0.49ms | 0.49ms | +0.0043ms | +0.89% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0030ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.03ms | -0.000097ms | -0.39% |
| p50 | 0.03ms | 0.03ms | +0.0018ms | +6.77% |
| p95 | 0.03ms | 0.03ms | +0.0029ms | +9.62% |
| p99 | 0.04ms | 0.03ms | +0.0025ms | +7.23% |
| mean | 0.03ms | 0.03ms | +0.0013ms | +4.58% |
| min | 0.02ms | 0.02ms | +0.00050ms | +2.08% |
| max | 0.04ms | 0.04ms | +0.0024ms | +6.72% |
| total | 0.57ms | 0.55ms | +0.03ms | +4.58% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0021ms |
| min | 0.0097ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0097ms | +0.00031ms | +3.18% |
| p50 | 0.01ms | 0.01ms | +0.00010ms | +1.03% |
| p95 | 0.02ms | 0.01ms | +0.0054ms | +47.46% |
| p99 | 0.02ms | 0.01ms | +0.0042ms | +32.98% |
| mean | 0.01ms | 0.01ms | +0.00067ms | +6.44% |
| min | 0.0097ms | 0.0097ms | +0.0000010ms | +0.01% |
| max | 0.02ms | 0.01ms | +0.0039ms | +29.84% |
| total | 0.22ms | 0.21ms | +0.01ms | +6.44% |

