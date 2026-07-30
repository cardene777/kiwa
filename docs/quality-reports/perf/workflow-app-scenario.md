# Perf Suite — workflow-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.01ms | 0.03ms | 100ms | 0.00045ms | PASS | stable (換算後 p10 +3% (閾値未満)、 p95 +54% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.0093ms | 0.02ms | 100ms | 0.00046ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.03ms | 0.03ms | 100ms | 0.00044ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 0.04ms | 100ms | 0.00046ms | PASS | stable (換算後 p10 +5% (閾値未満)、 p95 +183% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | cpu | 0.09ms | 0.10ms | 0.01ms | 0.123 | 0.120 | 0.0099ms | 0.0097ms |
| event_trigger_batch (5 event emits with 2 registered workflows each) | cpu | 0.09ms | 0.10ms | 0.0093ms | 0.104 | 0.087 | 0.0085ms | 0.0071ms |
| retry_error_handling (5 fail-then-succeed with backoff) | cpu | 0.09ms | 0.10ms | 0.03ms | 0.278 | 0.292 | 0.02ms | 0.02ms |
| retry_recovery (5 flaky async retry to success) | cpu | 0.09ms | 0.09ms | 0.03ms | 0.338 | 0.332 | 0.03ms | 0.03ms |
| concurrent_batch (5 batches of 4 items with error isolation) | cpu | 0.09ms | 0.10ms | 0.01ms | 0.126 | 0.120 | 0.01ms | 0.0099ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.05ms | 200ms | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.05ms | 200ms | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.13ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.14ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 2872 B | 0 B | 102400 B | yes | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 9248 B | 0 B | 102400 B | yes | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 3680 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | -376 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 4800 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment)

# Perf Report — multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.0090ms |
| max | 0.06ms |
| total | 0.31ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.901)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0099ms | 0.0097ms | +0.00026ms | +2.72% |
| p50 | 0.01ms | 0.01ms | +0.000093ms | +0.90% |
| p95 | 0.03ms | 0.02ms | +0.0091ms | +54.21% |
| p99 | 0.05ms | 0.02ms | +0.03ms | +189.51% |
| mean | 0.01ms | 0.01ms | +0.0032ms | +28.64% |
| min | 0.0081ms | 0.0084ms | -0.00031ms | -3.63% |
| max | 0.06ms | 0.02ms | +0.04ms | +220.77% |
| total | 0.28ms | 0.22ms | +0.06ms | +28.64% |

### event_trigger_batch (5 event emits with 2 registered workflows each)

# Perf Report — event_trigger_batch (5 event emits with 2 registered workflows each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0093ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0048ms |
| min | 0.0089ms |
| max | 0.03ms |
| total | 0.24ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.915)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0085ms | 0.0071ms | +0.0014ms | +19.17% |
| p50 | 0.0094ms | 0.0077ms | +0.0017ms | +22.80% |
| p95 | 0.02ms | 0.02ms | -0.00070ms | -3.64% |
| p99 | 0.02ms | 0.02ms | +0.0028ms | +12.95% |
| mean | 0.01ms | 0.0092ms | +0.0018ms | +19.36% |
| min | 0.0082ms | 0.0070ms | +0.0012ms | +17.25% |
| max | 0.03ms | 0.02ms | +0.0037ms | +16.48% |
| total | 0.22ms | 0.18ms | +0.04ms | +19.36% |

### retry_error_handling (5 fail-then-succeed with backoff)

# Perf Report — retry_error_handling (5 fail-then-succeed with backoff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0032ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.57ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.871)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0011ms | -4.78% |
| p50 | 0.02ms | 0.02ms | -0.0013ms | -5.33% |
| p95 | 0.03ms | 0.04ms | -0.01ms | -28.81% |
| p99 | 0.03ms | 0.05ms | -0.02ms | -32.91% |
| mean | 0.02ms | 0.03ms | -0.0027ms | -9.93% |
| min | 0.02ms | 0.02ms | +0.00014ms | +0.63% |
| max | 0.03ms | 0.05ms | -0.02ms | -33.71% |
| total | 0.49ms | 0.55ms | -0.05ms | -9.93% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0020ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.64ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.894)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00044ms | +1.65% |
| p50 | 0.03ms | 0.03ms | +0.00023ms | +0.83% |
| p95 | 0.03ms | 0.04ms | -0.0084ms | -20.64% |
| p99 | 0.03ms | 0.08ms | -0.04ms | -56.29% |
| mean | 0.03ms | 0.03ms | -0.0032ms | -10.13% |
| min | 0.03ms | 0.03ms | +0.00071ms | +2.68% |
| max | 0.03ms | 0.09ms | -0.05ms | -60.51% |
| total | 0.57ms | 0.64ms | -0.06ms | -10.13% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.06ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.07ms |
| total | 0.36ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.918)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0099ms | +0.00048ms | +4.83% |
| p50 | 0.01ms | 0.01ms | +0.00026ms | +2.42% |
| p95 | 0.04ms | 0.01ms | +0.02ms | +182.55% |
| p99 | 0.06ms | 0.01ms | +0.04ms | +295.58% |
| mean | 0.02ms | 0.01ms | +0.0053ms | +47.65% |
| min | 0.01ms | 0.0097ms | +0.00043ms | +4.40% |
| max | 0.06ms | 0.02ms | +0.05ms | +320.56% |
| total | 0.33ms | 0.22ms | +0.11ms | +47.65% |

