# Perf Suite — i18n-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00058ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.09ms | 0.13ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| locale_switch_batch (5 setLocale + translate) | 0.04ms | 0.05ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |
| missing_key_error_handling (5 missing translations) | 0.0039ms | 0.0071ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.05ms | 100ms | 0.00050ms | PASS | stable (換算後 p10 -0% (閾値未満)、 p95 +26% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | cpu | 0.09ms | 0.10ms | 0.09ms | 1.007 | 1.010 | n/a | 20.0% | 0.08ms | 0.08ms |
| locale_switch_batch (5 setLocale + translate) | cpu | 0.09ms | 0.09ms | 0.04ms | 0.457 | 0.457 | n/a | 20.0% | 0.04ms | 0.04ms |
| missing_key_error_handling (5 missing translations) | cpu | 0.09ms | 0.09ms | 0.0039ms | 0.041 | 0.042 | n/a | 20.0% | 0.0034ms | 0.0035ms |
| retry_recovery (5 flaky async retry to success) | cpu | 0.09ms | 0.10ms | 0.03ms | 0.331 | 0.332 | n/a | 20.0% | 0.03ms | 0.03ms |
| concurrent_batch (5 batches of 4 items with error isolation) | cpu | 0.09ms | 0.09ms | 0.01ms | 0.115 | 0.117 | n/a | 20.0% | 0.0094ms | 0.0095ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.49ms | 200ms | PASS |
| locale_switch_batch (5 setLocale + translate) | 0.20ms | 200ms | PASS |
| missing_key_error_handling (5 missing translations) | 0.03ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.15ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | -1248 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| locale_switch_batch (5 setLocale + translate) | -4352 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| missing_key_error_handling (5 missing translations) | 6784 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| retry_recovery (5 flaky async retry to success) | 3760 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 267792 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### translation_workflow (10 translate across 4 providers)

# Perf Report — translation_workflow (10 translate across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.09ms |
| p50 | 0.10ms |
| p95 | 0.13ms |
| p99 | 0.15ms |
| mean | 0.11ms |
| stdev | 0.01ms |
| min | 0.09ms |
| max | 0.15ms |
| total | 2.12ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.851)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.08ms | 0.08ms | -0.00027ms | -0.34% |
| p50 | 0.09ms | 0.09ms | -0.0023ms | -2.54% |
| p95 | 0.11ms | 0.18ms | -0.07ms | -37.60% |
| p99 | 0.12ms | 0.18ms | -0.06ms | -32.43% |
| mean | 0.09ms | 0.10ms | -0.01ms | -12.94% |
| min | 0.08ms | 0.08ms | -0.0033ms | -4.12% |
| max | 0.13ms | 0.18ms | -0.06ms | -31.20% |
| total | 1.81ms | 2.08ms | -0.27ms | -12.94% |

### locale_switch_batch (5 setLocale + translate)

# Perf Report — locale_switch_batch (5 setLocale + translate).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.05ms |
| stdev | 0.0025ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.90ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.875)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.000036ms | +0.10% |
| p50 | 0.04ms | 0.04ms | +0.00050ms | +1.30% |
| p95 | 0.04ms | 0.05ms | -0.0018ms | -3.84% |
| p99 | 0.05ms | 0.07ms | -0.02ms | -34.65% |
| mean | 0.04ms | 0.04ms | -0.0012ms | -2.90% |
| min | 0.04ms | 0.04ms | +0.000061ms | +0.16% |
| max | 0.05ms | 0.07ms | -0.03ms | -39.44% |
| total | 0.79ms | 0.81ms | -0.02ms | -2.90% |

### missing_key_error_handling (5 missing translations)

# Perf Report — missing_key_error_handling (5 missing translations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0039ms |
| p50 | 0.0039ms |
| p95 | 0.0071ms |
| p99 | 0.01ms |
| mean | 0.0046ms |
| stdev | 0.0020ms |
| min | 0.0038ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.879)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0035ms | -0.000052ms | -1.51% |
| p50 | 0.0035ms | 0.0035ms | -0.000082ms | -2.31% |
| p95 | 0.0062ms | 0.0059ms | +0.00033ms | +5.64% |
| p99 | 0.01ms | 0.0092ms | +0.00079ms | +8.60% |
| mean | 0.0040ms | 0.0040ms | -0.000013ms | -0.32% |
| min | 0.0034ms | 0.0034ms | -0.000048ms | -1.40% |
| max | 0.01ms | 0.01ms | +0.00091ms | +9.03% |
| total | 0.08ms | 0.08ms | -0.00026ms | -0.32% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.04ms |
| stdev | 0.0088ms |
| min | 0.03ms |
| max | 0.07ms |
| total | 0.74ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.867)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.000032ms | -0.12% |
| p50 | 0.03ms | 0.03ms | +0.0014ms | +5.12% |
| p95 | 0.04ms | 0.03ms | +0.0088ms | +25.58% |
| p99 | 0.06ms | 0.04ms | +0.02ms | +45.81% |
| mean | 0.03ms | 0.03ms | +0.0028ms | +9.66% |
| min | 0.03ms | 0.03ms | -0.00036ms | -1.34% |
| max | 0.06ms | 0.04ms | +0.02ms | +50.33% |
| total | 0.64ms | 0.59ms | +0.06ms | +9.66% |

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
| min | 0.01ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.867)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0094ms | 0.0095ms | -0.00010ms | -1.09% |
| p50 | 0.0096ms | 0.01ms | -0.00041ms | -4.12% |
| p95 | 0.01ms | 0.02ms | -0.0087ms | -39.82% |
| p99 | 0.02ms | 0.02ms | -0.0059ms | -24.22% |
| mean | 0.01ms | 0.01ms | -0.0011ms | -9.44% |
| min | 0.0092ms | 0.0094ms | -0.00024ms | -2.56% |
| max | 0.02ms | 0.03ms | -0.0052ms | -20.81% |
| total | 0.21ms | 0.23ms | -0.02ms | -9.44% |

