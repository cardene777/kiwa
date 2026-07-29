# Perf Suite — i18n-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.08ms | 0.13ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| locale_switch_batch (5 setLocale + translate) | 0.04ms | 0.04ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| missing_key_error_handling (5 missing translations) | 0.0034ms | 0.01ms | 100ms | 0.00049ms | PASS | stable (p10 -12% (閾値未満)、 p95 +66% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0094ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.37ms | 200ms | PASS |
| locale_switch_batch (5 setLocale + translate) | 0.15ms | 200ms | PASS |
| missing_key_error_handling (5 missing translations) | 0.02ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 1352 B | 0 B | 102400 B | yes | PASS |
| locale_switch_batch (5 setLocale + translate) | -3848 B | 0 B | 102400 B | yes | PASS |
| missing_key_error_handling (5 missing translations) | 6752 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 3728 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 5720 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### translation_workflow (10 translate across 4 providers)

# Perf Report — translation_workflow (10 translate across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.08ms |
| p50 | 0.09ms |
| p95 | 0.13ms |
| p99 | 0.15ms |
| mean | 0.09ms |
| stdev | 0.02ms |
| min | 0.08ms |
| max | 0.15ms |
| total | 1.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.08ms | 0.08ms | -0.0025ms | -3.04% |
| p50 | 0.09ms | 0.09ms | +0.00019ms | +0.22% |
| p95 | 0.13ms | 0.20ms | -0.07ms | -36.23% |
| p99 | 0.15ms | 0.28ms | -0.13ms | -47.75% |
| mean | 0.09ms | 0.11ms | -0.01ms | -12.55% |
| min | 0.08ms | 0.08ms | -0.0045ms | -5.47% |
| max | 0.15ms | 0.30ms | -0.15ms | -49.61% |
| total | 1.89ms | 2.16ms | -0.27ms | -12.55% |

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
| stdev | 0.0022ms |
| min | 0.04ms |
| max | 0.04ms |
| total | 0.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.0025ms | -6.28% |
| p50 | 0.04ms | 0.04ms | -0.0029ms | -6.99% |
| p95 | 0.04ms | 0.05ms | -0.01ms | -21.56% |
| p99 | 0.04ms | 0.06ms | -0.02ms | -28.86% |
| mean | 0.04ms | 0.04ms | -0.0042ms | -9.70% |
| min | 0.04ms | 0.04ms | -0.0025ms | -6.49% |
| max | 0.04ms | 0.06ms | -0.02ms | -30.46% |
| total | 0.78ms | 0.86ms | -0.08ms | -9.70% |

### missing_key_error_handling (5 missing translations)

# Perf Report — missing_key_error_handling (5 missing translations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0034ms |
| p50 | 0.0035ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0046ms |
| stdev | 0.0027ms |
| min | 0.0034ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0039ms | -0.00046ms | -11.83% |
| p50 | 0.0035ms | 0.0040ms | -0.00046ms | -11.52% |
| p95 | 0.01ms | 0.0066ms | +0.0044ms | +66.06% |
| p99 | 0.01ms | 0.01ms | +0.0017ms | +14.65% |
| mean | 0.0046ms | 0.0047ms | -0.00011ms | -2.36% |
| min | 0.0034ms | 0.0038ms | -0.00042ms | -10.97% |
| max | 0.01ms | 0.01ms | +0.0010ms | +7.92% |
| total | 0.09ms | 0.09ms | -0.0022ms | -2.36% |

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
| total | 0.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0032ms | -10.79% |
| p50 | 0.03ms | 0.03ms | -0.0048ms | -14.84% |
| p95 | 0.03ms | 0.07ms | -0.03ms | -50.47% |
| p99 | 0.04ms | 0.08ms | -0.05ms | -58.46% |
| mean | 0.03ms | 0.04ms | -0.0093ms | -24.59% |
| min | 0.03ms | 0.03ms | -0.0031ms | -10.35% |
| max | 0.04ms | 0.09ms | -0.05ms | -60.00% |
| total | 0.57ms | 0.76ms | -0.19ms | -24.59% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0094ms |
| p50 | 0.0097ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.010ms |
| stdev | 0.00085ms |
| min | 0.0092ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0094ms | 0.0099ms | -0.00050ms | -5.06% |
| p50 | 0.0097ms | 0.01ms | -0.00075ms | -7.20% |
| p95 | 0.01ms | 0.01ms | -0.0016ms | -12.82% |
| p99 | 0.01ms | 0.01ms | -0.000013ms | -0.10% |
| mean | 0.010ms | 0.01ms | -0.00069ms | -6.50% |
| min | 0.0092ms | 0.0098ms | -0.00054ms | -5.54% |
| max | 0.01ms | 0.01ms | +0.00038ms | +2.91% |
| total | 0.20ms | 0.21ms | -0.01ms | -6.50% |

