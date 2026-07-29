# Perf Suite — i18n-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.08ms | 0.11ms | 100ms | 0.00055ms | PASS | stable — gate 無効 (regressionGate=false) |
| locale_switch_batch (5 setLocale + translate) | 0.04ms | 0.05ms | 100ms | 0.00053ms | PASS | stable — gate 無効 (regressionGate=false) |
| missing_key_error_handling (5 missing translations) | 0.0032ms | 0.0041ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.03ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0096ms | 0.02ms | 100ms | 0.00056ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | cpu | 0.08ms | 0.08ms | 0.991 | 1.005 | 0.09ms | 0.09ms |
| locale_switch_batch (5 setLocale + translate) | cpu | 0.08ms | 0.04ms | 0.467 | 0.475 | 0.04ms | 0.04ms |
| missing_key_error_handling (5 missing translations) | cpu | 0.08ms | 0.0032ms | 0.040 | 0.040 | 0.0033ms | 0.0033ms |
| retry_recovery (5 flaky async retry to success) | cpu | 0.08ms | 0.03ms | 0.349 | 0.377 | 0.03ms | 0.03ms |
| concurrent_batch (5 batches of 4 items with error isolation) | cpu | 0.08ms | 0.0096ms | 0.120 | 0.126 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.37ms | 200ms | PASS |
| locale_switch_batch (5 setLocale + translate) | 0.17ms | 200ms | PASS |
| missing_key_error_handling (5 missing translations) | 0.02ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.12ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 1240 B | 0 B | 102400 B | yes | PASS |
| locale_switch_batch (5 setLocale + translate) | -4376 B | 0 B | 102400 B | yes | PASS |
| missing_key_error_handling (5 missing translations) | 6784 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 400 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 6080 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.13ms |
| mean | 0.09ms |
| stdev | 0.01ms |
| min | 0.08ms |
| max | 0.14ms |
| total | 1.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.08ms | 0.09ms | -0.0098ms | -10.89% |
| p50 | 0.08ms | 0.09ms | -0.0099ms | -10.48% |
| p95 | 0.11ms | 0.12ms | -0.01ms | -8.89% |
| p99 | 0.13ms | 0.12ms | +0.01ms | +8.74% |
| mean | 0.09ms | 0.10ms | -0.0095ms | -9.59% |
| min | 0.08ms | 0.08ms | -0.0047ms | -5.56% |
| max | 0.14ms | 0.12ms | +0.02ms | +13.13% |
| total | 1.80ms | 1.99ms | -0.19ms | -9.59% |

### locale_switch_batch (5 setLocale + translate)

# Perf Report — locale_switch_batch (5 setLocale + translate).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.07ms |
| mean | 0.04ms |
| stdev | 0.0089ms |
| min | 0.04ms |
| max | 0.08ms |
| total | 0.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.0029ms | -6.96% |
| p50 | 0.04ms | 0.04ms | -0.0014ms | -3.25% |
| p95 | 0.05ms | 0.05ms | +0.00089ms | +1.85% |
| p99 | 0.07ms | 0.05ms | +0.02ms | +35.13% |
| mean | 0.04ms | 0.04ms | -0.000096ms | -0.22% |
| min | 0.04ms | 0.04ms | -0.0020ms | -5.01% |
| max | 0.08ms | 0.06ms | +0.02ms | +42.38% |
| total | 0.86ms | 0.87ms | -0.0019ms | -0.22% |

### missing_key_error_handling (5 missing translations)

# Perf Report — missing_key_error_handling (5 missing translations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0032ms |
| p50 | 0.0033ms |
| p95 | 0.0041ms |
| p99 | 0.0056ms |
| mean | 0.0035ms |
| stdev | 0.00060ms |
| min | 0.0032ms |
| max | 0.0059ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0032ms | 0.0033ms | -0.000046ms | -1.40% |
| p50 | 0.0033ms | 0.0037ms | -0.00037ms | -10.21% |
| p95 | 0.0041ms | 0.01ms | -0.0097ms | -70.25% |
| p99 | 0.0056ms | 0.03ms | -0.02ms | -81.79% |
| mean | 0.0035ms | 0.0059ms | -0.0024ms | -40.70% |
| min | 0.0032ms | 0.0033ms | -0.000083ms | -2.52% |
| max | 0.0059ms | 0.03ms | -0.03ms | -82.93% |
| total | 0.07ms | 0.12ms | -0.05ms | -40.70% |

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
| stdev | 0.0024ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0029ms | -9.17% |
| p50 | 0.03ms | 0.03ms | -0.0054ms | -15.32% |
| p95 | 0.03ms | 0.08ms | -0.04ms | -56.07% |
| p99 | 0.04ms | 0.10ms | -0.06ms | -62.42% |
| mean | 0.03ms | 0.04ms | -0.01ms | -26.40% |
| min | 0.03ms | 0.03ms | -0.0028ms | -9.46% |
| max | 0.04ms | 0.10ms | -0.06ms | -63.63% |
| total | 0.61ms | 0.83ms | -0.22ms | -26.40% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0096ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0026ms |
| min | 0.0093ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0096ms | 0.01ms | -0.0017ms | -15.06% |
| p50 | 0.01ms | 0.01ms | -0.0025ms | -18.96% |
| p95 | 0.02ms | 0.04ms | -0.03ms | -62.36% |
| p99 | 0.02ms | 0.07ms | -0.05ms | -74.81% |
| mean | 0.01ms | 0.02ms | -0.0060ms | -33.77% |
| min | 0.0093ms | 0.01ms | -0.0017ms | -15.54% |
| max | 0.02ms | 0.08ms | -0.06ms | -76.56% |
| total | 0.24ms | 0.36ms | -0.12ms | -33.77% |

