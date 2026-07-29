# Perf Suite — workflow-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.0098ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.0085ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00050ms | PASS | stable (p10 +2% (閾値未満)、 p95 +51% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 0.02ms | 100ms | 0.00048ms | PASS | stable (p10 +7% (閾値未満)、 p95 +55% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | cpu | 0.08ms | 0.0098ms | 0.119 | 0.118 | 0.0098ms | 0.0097ms |
| event_trigger_batch (5 event emits with 2 registered workflows each) | cpu | 0.08ms | 0.0085ms | 0.106 | 0.090 | 0.0085ms | 0.0073ms |
| retry_error_handling (5 fail-then-succeed with backoff) | cpu | 0.08ms | 0.02ms | 0.284 | 0.264 | 0.02ms | 0.02ms |
| retry_recovery (5 flaky async retry to success) | cpu | 0.08ms | 0.03ms | 0.341 | 0.335 | 0.03ms | 0.03ms |
| concurrent_batch (5 batches of 4 items with error isolation) | cpu | 0.08ms | 0.01ms | 0.122 | 0.114 | 0.0098ms | 0.0092ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.05ms | 200ms | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.04ms | 200ms | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.11ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 616 B | 0 B | 102400 B | yes | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 9856 B | 0 B | 102400 B | yes | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 3760 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 648 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 1688 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0019ms |
| min | 0.0081ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0098ms | 0.0097ms | +0.000096ms | +1.00% |
| p50 | 0.01ms | 0.0099ms | +0.00010ms | +1.05% |
| p95 | 0.02ms | 0.02ms | -0.0027ms | -14.97% |
| p99 | 0.02ms | 0.02ms | -0.0039ms | -19.26% |
| mean | 0.01ms | 0.01ms | -0.00033ms | -3.04% |
| min | 0.0081ms | 0.0081ms | +0.000041ms | +0.51% |
| max | 0.02ms | 0.02ms | -0.0042ms | -20.20% |
| total | 0.21ms | 0.22ms | -0.0067ms | -3.04% |

### event_trigger_batch (5 event emits with 2 registered workflows each)

# Perf Report — event_trigger_batch (5 event emits with 2 registered workflows each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0085ms |
| p50 | 0.0094ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0047ms |
| min | 0.0080ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0085ms | 0.0073ms | +0.0013ms | +17.21% |
| p50 | 0.0094ms | 0.0077ms | +0.0017ms | +21.63% |
| p95 | 0.02ms | 0.04ms | -0.01ms | -36.92% |
| p99 | 0.02ms | 0.07ms | -0.04ms | -63.41% |
| mean | 0.01ms | 0.01ms | -0.0020ms | -14.96% |
| min | 0.0080ms | 0.0072ms | +0.00079ms | +11.04% |
| max | 0.02ms | 0.07ms | -0.05ms | -66.76% |
| total | 0.22ms | 0.26ms | -0.04ms | -14.96% |

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
| stdev | 0.0030ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0013ms | +6.11% |
| p50 | 0.02ms | 0.02ms | +0.0020ms | +9.08% |
| p95 | 0.03ms | 0.03ms | +0.0000063ms | +0.02% |
| p99 | 0.03ms | 0.03ms | +0.00010ms | +0.31% |
| mean | 0.03ms | 0.02ms | +0.0020ms | +8.53% |
| min | 0.02ms | 0.02ms | +0.0013ms | +6.31% |
| max | 0.03ms | 0.03ms | +0.00013ms | +0.37% |
| total | 0.50ms | 0.46ms | +0.04ms | +8.53% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.08ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.09ms |
| total | 0.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00012ms | +0.43% |
| p50 | 0.03ms | 0.03ms | +0.00092ms | +3.33% |
| p95 | 0.04ms | 0.03ms | +0.01ms | +49.04% |
| p99 | 0.08ms | 0.03ms | +0.05ms | +144.14% |
| mean | 0.03ms | 0.03ms | +0.0050ms | +17.99% |
| min | 0.03ms | 0.03ms | +0.000042ms | +0.16% |
| max | 0.09ms | 0.03ms | +0.05ms | +165.41% |
| total | 0.66ms | 0.56ms | +0.10ms | +17.99% |

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
| stdev | 0.0027ms |
| min | 0.0098ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0092ms | +0.00089ms | +9.59% |
| p50 | 0.01ms | 0.0098ms | +0.00094ms | +9.56% |
| p95 | 0.02ms | 0.01ms | +0.0067ms | +59.03% |
| p99 | 0.02ms | 0.01ms | +0.0073ms | +57.82% |
| mean | 0.01ms | 0.0099ms | +0.0017ms | +17.16% |
| min | 0.0098ms | 0.0091ms | +0.00071ms | +7.81% |
| max | 0.02ms | 0.01ms | +0.0075ms | +57.55% |
| total | 0.23ms | 0.20ms | +0.03ms | +17.16% |

