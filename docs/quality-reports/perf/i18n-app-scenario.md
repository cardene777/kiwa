# Perf Suite — i18n-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.08ms | 0.10ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| locale_switch_batch (5 setLocale + translate) | 0.04ms | 0.04ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| missing_key_error_handling (5 missing translations) | 0.0032ms | 0.0088ms | 100ms | 0.00042ms | PASS | stable (p10 -16% (閾値未満)、 p95 +33% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0097ms | 0.01ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.35ms | 200ms | PASS |
| locale_switch_batch (5 setLocale + translate) | 0.15ms | 200ms | PASS |
| missing_key_error_handling (5 missing translations) | 0.02ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.12ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 1384 B | 0 B | 102400 B | yes | PASS |
| locale_switch_batch (5 setLocale + translate) | -4352 B | 0 B | 102400 B | yes | PASS |
| missing_key_error_handling (5 missing translations) | 5776 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 3664 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 3432 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### translation_workflow (10 translate across 4 providers)

# Perf Report — translation_workflow (10 translate across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.08ms |
| p50 | 0.09ms |
| p95 | 0.10ms |
| p99 | 0.10ms |
| mean | 0.09ms |
| stdev | 0.0078ms |
| min | 0.08ms |
| max | 0.10ms |
| total | 1.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.08ms | 0.08ms | -0.0027ms | -3.20% |
| p50 | 0.09ms | 0.09ms | -0.0012ms | -1.34% |
| p95 | 0.10ms | 0.20ms | -0.09ms | -47.82% |
| p99 | 0.10ms | 0.28ms | -0.18ms | -63.76% |
| mean | 0.09ms | 0.11ms | -0.02ms | -17.94% |
| min | 0.08ms | 0.08ms | -0.0041ms | -4.92% |
| max | 0.10ms | 0.30ms | -0.20ms | -66.33% |
| total | 1.77ms | 2.16ms | -0.39ms | -17.94% |

### locale_switch_batch (5 setLocale + translate)

# Perf Report — locale_switch_batch (5 setLocale + translate).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.04ms |
| stdev | 0.0023ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.0031ms | -7.94% |
| p50 | 0.04ms | 0.04ms | -0.0036ms | -8.82% |
| p95 | 0.04ms | 0.05ms | -0.01ms | -23.56% |
| p99 | 0.04ms | 0.06ms | -0.02ms | -26.88% |
| mean | 0.04ms | 0.04ms | -0.0050ms | -11.70% |
| min | 0.04ms | 0.04ms | -0.0029ms | -7.35% |
| max | 0.05ms | 0.06ms | -0.02ms | -27.60% |
| total | 0.76ms | 0.86ms | -0.10ms | -11.70% |

### missing_key_error_handling (5 missing translations)

# Perf Report — missing_key_error_handling (5 missing translations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0032ms |
| p50 | 0.0034ms |
| p95 | 0.0088ms |
| p99 | 0.01ms |
| mean | 0.0046ms |
| stdev | 0.0029ms |
| min | 0.0032ms |
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0032ms | 0.0039ms | -0.00062ms | -16.04% |
| p50 | 0.0034ms | 0.0040ms | -0.00056ms | -14.15% |
| p95 | 0.0088ms | 0.0066ms | +0.0022ms | +32.98% |
| p99 | 0.01ms | 0.01ms | +0.0024ms | +20.75% |
| mean | 0.0046ms | 0.0047ms | -0.000042ms | -0.89% |
| min | 0.0032ms | 0.0038ms | -0.00058ms | -15.38% |
| max | 0.02ms | 0.01ms | +0.0024ms | +19.14% |
| total | 0.09ms | 0.09ms | -0.00083ms | -0.89% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.0021ms |
| min | 0.03ms |
| max | 0.03ms |
| total | 0.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0031ms | -10.38% |
| p50 | 0.03ms | 0.03ms | -0.0049ms | -15.04% |
| p95 | 0.03ms | 0.07ms | -0.03ms | -50.04% |
| p99 | 0.03ms | 0.08ms | -0.05ms | -59.58% |
| mean | 0.03ms | 0.04ms | -0.0097ms | -25.60% |
| min | 0.03ms | 0.03ms | -0.0035ms | -11.75% |
| max | 0.03ms | 0.09ms | -0.05ms | -61.42% |
| total | 0.56ms | 0.76ms | -0.19ms | -25.60% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0097ms |
| p50 | 0.010ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00072ms |
| min | 0.0096ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0097ms | 0.0099ms | -0.00022ms | -2.19% |
| p50 | 0.010ms | 0.01ms | -0.00044ms | -4.20% |
| p95 | 0.01ms | 0.01ms | -0.00096ms | -7.85% |
| p99 | 0.01ms | 0.01ms | -0.00032ms | -2.55% |
| mean | 0.01ms | 0.01ms | -0.00045ms | -4.19% |
| min | 0.0096ms | 0.0098ms | -0.00021ms | -2.13% |
| max | 0.01ms | 0.01ms | -0.00017ms | -1.29% |
| total | 0.20ms | 0.21ms | -0.0089ms | -4.19% |

