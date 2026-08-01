# Perf Suite — workflow-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.01ms | 0.02ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.0077ms | 0.03ms | 100ms | 0.00046ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +20% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.02ms | 0.03ms | 100ms | 0.00046ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 0.02ms | 100ms | 0.00046ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | cpu | 0.09ms | 0.10ms | 0.01ms | 0.121 | 0.120 | n/a | 20.0% | 0.0098ms | 0.0097ms |
| event_trigger_batch (5 event emits with 2 registered workflows each) | cpu | 0.09ms | 0.10ms | 0.0077ms | 0.086 | 0.087 | n/a | 20.0% | 0.0070ms | 0.0071ms |
| retry_error_handling (5 fail-then-succeed with backoff) | cpu | 0.09ms | 0.09ms | 0.02ms | 0.272 | 0.292 | n/a | 20.0% | 0.02ms | 0.02ms |
| retry_recovery (5 flaky async retry to success) | cpu | 0.09ms | 0.09ms | 0.03ms | 0.338 | 0.332 | n/a | 20.0% | 0.03ms | 0.03ms |
| concurrent_batch (5 batches of 4 items with error isolation) | cpu | 0.09ms | 0.11ms | 0.01ms | 0.121 | 0.120 | n/a | 20.0% | 0.010ms | 0.0099ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | 0.05ms | 200ms | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 0.06ms | 200ms | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 0.12ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.29ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment) | -1536 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| event_trigger_batch (5 event emits with 2 registered workflows each) | 9248 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| retry_error_handling (5 fail-then-succeed with backoff) | 4592 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| retry_recovery (5 flaky async retry to success) | -376 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 2440 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

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
| stdev | 0.0034ms |
| min | 0.0090ms |
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.906)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0098ms | 0.0097ms | +0.00012ms | +1.26% |
| p50 | 0.01ms | 0.01ms | +0.000038ms | +0.37% |
| p95 | 0.02ms | 0.02ms | +0.0020ms | +11.78% |
| p99 | 0.02ms | 0.02ms | +0.0022ms | +12.08% |
| mean | 0.01ms | 0.01ms | +0.00043ms | +3.90% |
| min | 0.0082ms | 0.0084ms | -0.00022ms | -2.63% |
| max | 0.02ms | 0.02ms | +0.0022ms | +12.14% |
| total | 0.23ms | 0.22ms | +0.0086ms | +3.90% |

### event_trigger_batch (5 event emits with 2 registered workflows each)

# Perf Report — event_trigger_batch (5 event emits with 2 registered workflows each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0077ms |
| p50 | 0.0090ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0056ms |
| min | 0.0075ms |
| max | 0.03ms |
| total | 0.22ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.916)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0070ms | 0.0071ms | -0.000097ms | -1.36% |
| p50 | 0.0082ms | 0.0077ms | +0.00056ms | +7.25% |
| p95 | 0.02ms | 0.02ms | +0.0039ms | +20.19% |
| p99 | 0.02ms | 0.02ms | +0.0022ms | +9.93% |
| mean | 0.01ms | 0.0092ms | +0.00085ms | +9.24% |
| min | 0.0069ms | 0.0070ms | -0.000052ms | -0.74% |
| max | 0.02ms | 0.02ms | +0.0017ms | +7.74% |
| total | 0.20ms | 0.18ms | +0.02ms | +9.24% |

### retry_error_handling (5 fail-then-succeed with backoff)

# Perf Report — retry_error_handling (5 fail-then-succeed with backoff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0031ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.53ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.911)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0016ms | -6.88% |
| p50 | 0.02ms | 0.02ms | -0.0017ms | -6.76% |
| p95 | 0.03ms | 0.04ms | -0.01ms | -24.73% |
| p99 | 0.03ms | 0.05ms | -0.02ms | -34.79% |
| mean | 0.02ms | 0.03ms | -0.0033ms | -12.14% |
| min | 0.02ms | 0.02ms | -0.00065ms | -2.86% |
| max | 0.03ms | 0.05ms | -0.02ms | -36.76% |
| total | 0.48ms | 0.55ms | -0.07ms | -12.14% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.07ms |
| mean | 0.04ms |
| stdev | 0.0098ms |
| min | 0.03ms |
| max | 0.07ms |
| total | 0.70ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.903)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00046ms | +1.73% |
| p50 | 0.03ms | 0.03ms | +0.00073ms | +2.63% |
| p95 | 0.04ms | 0.04ms | -0.00036ms | -0.89% |
| p99 | 0.06ms | 0.08ms | -0.02ms | -19.79% |
| mean | 0.03ms | 0.03ms | -0.000094ms | -0.29% |
| min | 0.03ms | 0.03ms | +0.00042ms | +1.61% |
| max | 0.07ms | 0.09ms | -0.02ms | -22.03% |
| total | 0.63ms | 0.64ms | -0.0019ms | -0.29% |

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
| stdev | 0.0017ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.918)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.010ms | 0.0099ms | +0.000050ms | +0.50% |
| p50 | 0.01ms | 0.01ms | +0.0014ms | +13.32% |
| p95 | 0.01ms | 0.01ms | +0.00059ms | +4.35% |
| p99 | 0.01ms | 0.01ms | -0.00031ms | -2.09% |
| mean | 0.01ms | 0.01ms | +0.00072ms | +6.45% |
| min | 0.0099ms | 0.0097ms | +0.00016ms | +1.60% |
| max | 0.01ms | 0.02ms | -0.00054ms | -3.52% |
| total | 0.24ms | 0.22ms | +0.01ms | +6.45% |

