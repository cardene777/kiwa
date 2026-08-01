# Perf Suite — macos-app-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.02ms | 0.05ms | 100ms | 0.0011ms | PASS | stable (換算後 p10 +7% (閾値未満)、 p95 +43% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| a11y_batch (5 accessibility tree capture) | 0.0033ms | 0.0052ms | 100ms | 0.0010ms | PASS | stable — gate 無効 (regressionGate=false) |
| notification_error_handling (5 empty title/body reject) | 0.0015ms | 0.0022ms | 100ms | 0.0011ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.0010ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 0.02ms | 100ms | 0.0010ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | cpu | 0.09ms | 0.15ms | 0.02ms | 0.199 | 0.185 | n/a | 20.0% | 0.02ms | 0.02ms |
| a11y_batch (5 accessibility tree capture) | cpu | 0.09ms | 0.10ms | 0.0033ms | 0.037 | 0.035 | n/a | 20.0% | 0.0030ms | 0.0028ms |
| notification_error_handling (5 empty title/body reject) | cpu | 0.09ms | 0.09ms | 0.0015ms | 0.017 | 0.015 | n/a | 20.0% | 0.0014ms | 0.0012ms |
| retry_recovery (5 flaky async retry to success) | cpu | 0.09ms | 0.09ms | 0.03ms | 0.340 | 0.355 | n/a | 20.0% | 0.03ms | 0.03ms |
| concurrent_batch (5 batches of 4 items with error isolation) | cpu | 0.09ms | 0.10ms | 0.01ms | 0.122 | 0.123 | n/a | 20.0% | 0.0098ms | 0.010ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.07ms | 200ms | PASS |
| a11y_batch (5 accessibility tree capture) | 0.03ms | 200ms | PASS |
| notification_error_handling (5 empty title/body reject) | 0.01ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.15ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | -8432 B | 30400 B | 102400 B | yes | 23 (3 + 20) | PASS |
| a11y_batch (5 accessibility tree capture) | 7184 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| notification_error_handling (5 empty title/body reject) | 744 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| retry_recovery (5 flaky async retry to success) | -4200 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 9440 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### user_flow_workflow (10 interaction+screencap cycle across modes)

# Perf Report — user_flow_workflow (10 interaction+screencap cycle across modes).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.07ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.07ms |
| total | 0.64ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.923)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0011ms | +7.36% |
| p50 | 0.03ms | 0.02ms | +0.01ms | +85.27% |
| p95 | 0.05ms | 0.03ms | +0.01ms | +42.79% |
| p99 | 0.06ms | 0.04ms | +0.02ms | +57.22% |
| mean | 0.03ms | 0.02ms | +0.0099ms | +50.89% |
| min | 0.02ms | 0.01ms | +0.00074ms | +4.94% |
| max | 0.07ms | 0.04ms | +0.02ms | +60.02% |
| total | 0.59ms | 0.39ms | +0.20ms | +50.89% |

### a11y_batch (5 accessibility tree capture)

# Perf Report — a11y_batch (5 accessibility tree capture).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0033ms |
| p50 | 0.0036ms |
| p95 | 0.0052ms |
| p99 | 0.0060ms |
| mean | 0.0039ms |
| stdev | 0.00073ms |
| min | 0.0032ms |
| max | 0.0062ms |
| total | 0.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.895)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0028ms | +0.00019ms | +6.80% |
| p50 | 0.0032ms | 0.0029ms | +0.00035ms | +12.11% |
| p95 | 0.0047ms | 0.0048ms | -0.000079ms | -1.65% |
| p99 | 0.0054ms | 0.0048ms | +0.00060ms | +12.52% |
| mean | 0.0035ms | 0.0031ms | +0.00034ms | +10.72% |
| min | 0.0029ms | 0.0027ms | +0.00016ms | +5.83% |
| max | 0.0056ms | 0.0048ms | +0.00077ms | +16.03% |
| total | 0.07ms | 0.06ms | +0.0067ms | +10.72% |

### notification_error_handling (5 empty title/body reject)

# Perf Report — notification_error_handling (5 empty title/body reject).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0015ms |
| p50 | 0.0015ms |
| p95 | 0.0022ms |
| p99 | 0.0039ms |
| mean | 0.0017ms |
| stdev | 0.00063ms |
| min | 0.0015ms |
| max | 0.0043ms |
| total | 0.03ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.913)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0014ms | 0.0012ms | +0.00016ms | +13.31% |
| p50 | 0.0014ms | 0.0013ms | +0.00016ms | +12.57% |
| p95 | 0.0020ms | 0.0023ms | -0.00033ms | -14.28% |
| p99 | 0.0036ms | 0.0049ms | -0.0013ms | -27.29% |
| mean | 0.0016ms | 0.0015ms | +0.000031ms | +2.05% |
| min | 0.0014ms | 0.0012ms | +0.00016ms | +13.31% |
| max | 0.0040ms | 0.0055ms | -0.0016ms | -28.64% |
| total | 0.03ms | 0.03ms | +0.00063ms | +2.05% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.0058ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.74ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.877)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0012ms | -4.01% |
| p50 | 0.03ms | 0.03ms | -0.0029ms | -8.94% |
| p95 | 0.04ms | 0.09ms | -0.05ms | -57.29% |
| p99 | 0.05ms | 0.13ms | -0.08ms | -64.73% |
| mean | 0.03ms | 0.04ms | -0.01ms | -26.32% |
| min | 0.03ms | 0.03ms | -0.0015ms | -5.15% |
| max | 0.05ms | 0.14ms | -0.09ms | -65.94% |
| total | 0.65ms | 0.88ms | -0.23ms | -26.32% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0054ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.28ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.896)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0098ms | 0.010ms | -0.00013ms | -1.30% |
| p50 | 0.01ms | 0.01ms | +0.00046ms | +4.43% |
| p95 | 0.02ms | 0.02ms | +0.00017ms | +0.92% |
| p99 | 0.03ms | 0.02ms | +0.0039ms | +16.25% |
| mean | 0.01ms | 0.01ms | +0.00084ms | +7.12% |
| min | 0.0096ms | 0.0099ms | -0.00036ms | -3.64% |
| max | 0.03ms | 0.03ms | +0.0048ms | +18.96% |
| total | 0.25ms | 0.24ms | +0.02ms | +7.12% |

