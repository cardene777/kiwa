# Perf Suite — i18n-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.08ms | 0.11ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| locale_switch_batch (5 setLocale + translate) | 0.04ms | 0.05ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| missing_key_error_handling (5 missing translations) | 0.0033ms | 0.0056ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0093ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | cpu | 0.08ms | 0.09ms | 0.08ms | 0.992 | 1.010 | 0.08ms | 0.08ms |
| locale_switch_batch (5 setLocale + translate) | cpu | 0.08ms | 0.09ms | 0.04ms | 0.455 | 0.457 | 0.04ms | 0.04ms |
| missing_key_error_handling (5 missing translations) | cpu | 0.08ms | 0.08ms | 0.0033ms | 0.041 | 0.042 | 0.0034ms | 0.0035ms |
| retry_recovery (5 flaky async retry to success) | cpu | 0.08ms | 0.08ms | 0.03ms | 0.345 | 0.332 | 0.03ms | 0.03ms |
| concurrent_batch (5 batches of 4 items with error isolation) | cpu | 0.08ms | 0.08ms | 0.0093ms | 0.116 | 0.117 | 0.0095ms | 0.0095ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.35ms | 200ms | PASS |
| locale_switch_batch (5 setLocale + translate) | 0.18ms | 200ms | PASS |
| missing_key_error_handling (5 missing translations) | 0.02ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.15ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 2632 B | 0 B | 102400 B | yes | PASS |
| locale_switch_batch (5 setLocale + translate) | -3472 B | 0 B | 102400 B | yes | PASS |
| missing_key_error_handling (5 missing translations) | 6816 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 3760 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 6160 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### translation_workflow (10 translate across 4 providers)

# Perf Report — translation_workflow (10 translate across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.08ms |
| p50 | 0.08ms |
| p95 | 0.11ms |
| p99 | 0.12ms |
| mean | 0.09ms |
| stdev | 0.01ms |
| min | 0.08ms |
| max | 0.12ms |
| total | 1.77ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.003)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.08ms | 0.08ms | -0.0014ms | -1.75% |
| p50 | 0.08ms | 0.09ms | -0.0056ms | -6.28% |
| p95 | 0.11ms | 0.18ms | -0.07ms | -38.26% |
| p99 | 0.12ms | 0.18ms | -0.07ms | -35.70% |
| mean | 0.09ms | 0.10ms | -0.01ms | -14.31% |
| min | 0.08ms | 0.08ms | -0.00037ms | -0.47% |
| max | 0.12ms | 0.18ms | -0.06ms | -35.09% |
| total | 1.78ms | 2.08ms | -0.30ms | -14.31% |

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
| mean | 0.04ms |
| stdev | 0.0041ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.80ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.020)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.00014ms | -0.38% |
| p50 | 0.04ms | 0.04ms | +0.00094ms | +2.46% |
| p95 | 0.05ms | 0.05ms | +0.0019ms | +4.09% |
| p99 | 0.05ms | 0.07ms | -0.02ms | -28.56% |
| mean | 0.04ms | 0.04ms | +0.00040ms | +0.97% |
| min | 0.04ms | 0.04ms | -0.000054ms | -0.14% |
| max | 0.05ms | 0.07ms | -0.03ms | -33.63% |
| total | 0.82ms | 0.81ms | +0.0079ms | +0.97% |

### missing_key_error_handling (5 missing translations)

# Perf Report — missing_key_error_handling (5 missing translations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0033ms |
| p50 | 0.0035ms |
| p95 | 0.0056ms |
| p99 | 0.0066ms |
| mean | 0.0042ms |
| stdev | 0.0010ms |
| min | 0.0033ms |
| max | 0.0068ms |
| total | 0.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.019)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0035ms | -0.000057ms | -1.66% |
| p50 | 0.0036ms | 0.0035ms | +0.000024ms | +0.67% |
| p95 | 0.0057ms | 0.0059ms | -0.00021ms | -3.63% |
| p99 | 0.0067ms | 0.0092ms | -0.0025ms | -27.22% |
| mean | 0.0043ms | 0.0040ms | +0.00023ms | +5.79% |
| min | 0.0034ms | 0.0034ms | -0.000021ms | -0.63% |
| max | 0.0070ms | 0.01ms | -0.0031ms | -30.68% |
| total | 0.09ms | 0.08ms | +0.0047ms | +5.79% |

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
| stdev | 0.0037ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.62ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.001)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0011ms | +3.91% |
| p50 | 0.03ms | 0.03ms | +0.0012ms | +4.48% |
| p95 | 0.04ms | 0.03ms | +0.0033ms | +9.53% |
| p99 | 0.04ms | 0.04ms | +0.0017ms | +4.61% |
| mean | 0.03ms | 0.03ms | +0.0015ms | +5.22% |
| min | 0.03ms | 0.03ms | +0.00068ms | +2.54% |
| max | 0.04ms | 0.04ms | +0.0014ms | +3.51% |
| total | 0.62ms | 0.59ms | +0.03ms | +5.22% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0093ms |
| p50 | 0.0096ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0029ms |
| min | 0.0092ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.017)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.0095ms | -0.000015ms | -0.16% |
| p50 | 0.0098ms | 0.01ms | -0.00026ms | -2.56% |
| p95 | 0.01ms | 0.02ms | -0.0085ms | -38.99% |
| p99 | 0.02ms | 0.02ms | -0.0037ms | -15.08% |
| mean | 0.01ms | 0.01ms | -0.00085ms | -7.39% |
| min | 0.0094ms | 0.0094ms | -0.000013ms | -0.14% |
| max | 0.02ms | 0.03ms | -0.0025ms | -9.86% |
| total | 0.21ms | 0.23ms | -0.02ms | -7.39% |

