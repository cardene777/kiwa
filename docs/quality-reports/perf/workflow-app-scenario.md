# Perf Suite — workflow-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.0080ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.02ms | 0.15ms | 100ms | 0.00050ms | PASS | stable (p10 -1% (閾値未満)、 p95 +384% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.05ms | 200ms | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.05ms | 200ms | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.11ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.15ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.23ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 1440 B | 0 B | 102400 B | yes | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 9312 B | 0 B | 102400 B | yes | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 4808 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 1992 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 6352 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment)

# Perf Report — multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0038ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0098ms | +0.00062ms | +6.35% |
| p50 | 0.01ms | 0.01ms | +0.00081ms | +7.37% |
| p95 | 0.02ms | 0.02ms | -0.00051ms | -2.47% |
| p99 | 0.02ms | 0.02ms | -7.3e-7ms | -0.00% |
| mean | 0.01ms | 0.01ms | +0.00044ms | +3.43% |
| min | 0.01ms | 0.0097ms | +0.00054ms | +5.58% |
| max | 0.02ms | 0.02ms | +0.00013ms | +0.51% |
| total | 0.26ms | 0.26ms | +0.0088ms | +3.43% |

### event_trigger_batch (5 event emits with 2 registered workflows each)

# Perf Report — event_trigger_batch (5 event emits with 2 registered workflows each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0080ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0053ms |
| min | 0.0070ms |
| max | 0.03ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0080ms | 0.0074ms | +0.00067ms | +9.17% |
| p50 | 0.01ms | 0.0084ms | +0.0018ms | +21.59% |
| p95 | 0.02ms | 0.02ms | -0.000045ms | -0.21% |
| p99 | 0.03ms | 0.02ms | +0.0031ms | +13.34% |
| mean | 0.01ms | 0.01ms | +0.0016ms | +15.04% |
| min | 0.0070ms | 0.0073ms | -0.00021ms | -2.87% |
| max | 0.03ms | 0.02ms | +0.0038ms | +16.52% |
| total | 0.24ms | 0.21ms | +0.03ms | +15.04% |

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
| mean | 0.03ms |
| stdev | 0.0035ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00029ms | +1.28% |
| p50 | 0.02ms | 0.02ms | +0.00094ms | +4.09% |
| p95 | 0.03ms | 0.03ms | +0.00021ms | +0.67% |
| p99 | 0.03ms | 0.03ms | -0.00099ms | -2.94% |
| mean | 0.03ms | 0.02ms | +0.00074ms | +3.03% |
| min | 0.02ms | 0.02ms | +0.00029ms | +1.31% |
| max | 0.03ms | 0.03ms | -0.0013ms | -3.78% |
| total | 0.50ms | 0.49ms | +0.01ms | +3.03% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.15ms |
| p99 | 0.19ms |
| mean | 0.05ms |
| stdev | 0.05ms |
| min | 0.02ms |
| max | 0.20ms |
| total | 1.00ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.03ms | -0.00031ms | -1.25% |
| p50 | 0.03ms | 0.03ms | +0.0070ms | +26.02% |
| p95 | 0.15ms | 0.03ms | +0.12ms | +383.98% |
| p99 | 0.19ms | 0.03ms | +0.16ms | +459.05% |
| mean | 0.05ms | 0.03ms | +0.02ms | +83.29% |
| min | 0.02ms | 0.02ms | +0.00025ms | +1.04% |
| max | 0.20ms | 0.04ms | +0.17ms | +475.01% |
| total | 1.00ms | 0.55ms | +0.46ms | +83.29% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00062ms |
| min | 0.01ms |
| max | 0.01ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0097ms | +0.00041ms | +4.21% |
| p50 | 0.01ms | 0.01ms | +0.00040ms | +3.90% |
| p95 | 0.01ms | 0.01ms | +0.00042ms | +3.70% |
| p99 | 0.01ms | 0.01ms | -0.00075ms | -5.86% |
| mean | 0.01ms | 0.01ms | +0.00031ms | +2.98% |
| min | 0.01ms | 0.0097ms | +0.00033ms | +3.46% |
| max | 0.01ms | 0.01ms | -0.0010ms | -7.94% |
| total | 0.21ms | 0.21ms | +0.0062ms | +2.98% |

