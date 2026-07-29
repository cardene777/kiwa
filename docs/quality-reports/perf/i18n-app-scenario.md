# Perf Suite — i18n-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.08ms | 0.18ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| locale_switch_batch (5 setLocale + translate) | 0.04ms | 0.08ms | 100ms | 0.00050ms | PASS | stable (p10 -4% (閾値未満)、 p95 +51% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| missing_key_error_handling (5 missing translations) | 0.0034ms | 0.0069ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0095ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.35ms | 200ms | PASS |
| locale_switch_batch (5 setLocale + translate) | 0.17ms | 200ms | PASS |
| missing_key_error_handling (5 missing translations) | 0.02ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 1640 B | 0 B | 102400 B | yes | PASS |
| locale_switch_batch (5 setLocale + translate) | -4304 B | 0 B | 102400 B | yes | PASS |
| missing_key_error_handling (5 missing translations) | 6688 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 3664 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 3264 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### translation_workflow (10 translate across 4 providers)

# Perf Report — translation_workflow (10 translate across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.08ms |
| p50 | 0.09ms |
| p95 | 0.18ms |
| p99 | 0.27ms |
| mean | 0.11ms |
| stdev | 0.05ms |
| min | 0.08ms |
| max | 0.29ms |
| total | 2.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.08ms | 0.08ms | +0.00085ms | +1.03% |
| p50 | 0.09ms | 0.09ms | +0.0054ms | +6.21% |
| p95 | 0.18ms | 0.20ms | -0.01ms | -5.85% |
| p99 | 0.27ms | 0.28ms | -0.02ms | -6.17% |
| mean | 0.11ms | 0.11ms | +0.0027ms | +2.46% |
| min | 0.08ms | 0.08ms | -0.000084ms | -0.10% |
| max | 0.29ms | 0.30ms | -0.02ms | -6.22% |
| total | 2.21ms | 2.16ms | +0.05ms | +2.46% |

### locale_switch_batch (5 setLocale + translate)

# Perf Report — locale_switch_batch (5 setLocale + translate).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.08ms |
| p99 | 0.10ms |
| mean | 0.05ms |
| stdev | 0.02ms |
| min | 0.04ms |
| max | 0.11ms |
| total | 0.94ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.0014ms | -3.60% |
| p50 | 0.04ms | 0.04ms | -0.00077ms | -1.89% |
| p95 | 0.08ms | 0.05ms | +0.03ms | +51.26% |
| p99 | 0.10ms | 0.06ms | +0.04ms | +69.37% |
| mean | 0.05ms | 0.04ms | +0.0039ms | +9.04% |
| min | 0.04ms | 0.04ms | -0.0013ms | -3.19% |
| max | 0.11ms | 0.06ms | +0.05ms | +73.33% |
| total | 0.94ms | 0.86ms | +0.08ms | +9.04% |

### missing_key_error_handling (5 missing translations)

# Perf Report — missing_key_error_handling (5 missing translations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0034ms |
| p50 | 0.0035ms |
| p95 | 0.0069ms |
| p99 | 0.0078ms |
| mean | 0.0041ms |
| stdev | 0.0014ms |
| min | 0.0034ms |
| max | 0.0080ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0039ms | -0.00050ms | -12.81% |
| p50 | 0.0035ms | 0.0040ms | -0.00052ms | -13.09% |
| p95 | 0.0069ms | 0.0066ms | +0.00029ms | +4.32% |
| p99 | 0.0078ms | 0.01ms | -0.0036ms | -31.60% |
| mean | 0.0041ms | 0.0047ms | -0.00062ms | -13.16% |
| min | 0.0034ms | 0.0038ms | -0.00042ms | -10.97% |
| max | 0.0080ms | 0.01ms | -0.0046ms | -36.30% |
| total | 0.08ms | 0.09ms | -0.01ms | -13.16% |

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
| stdev | 0.0027ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0020ms | -6.65% |
| p50 | 0.03ms | 0.03ms | -0.0038ms | -11.58% |
| p95 | 0.04ms | 0.07ms | -0.03ms | -47.49% |
| p99 | 0.04ms | 0.08ms | -0.05ms | -54.74% |
| mean | 0.03ms | 0.04ms | -0.0081ms | -21.44% |
| min | 0.03ms | 0.03ms | -0.0018ms | -6.16% |
| max | 0.04ms | 0.09ms | -0.05ms | -56.13% |
| total | 0.60ms | 0.76ms | -0.16ms | -21.44% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0095ms |
| p50 | 0.0099ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0015ms |
| min | 0.0094ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.0099ms | -0.00039ms | -3.92% |
| p50 | 0.0099ms | 0.01ms | -0.00052ms | -5.00% |
| p95 | 0.01ms | 0.01ms | -0.00022ms | -1.82% |
| p99 | 0.02ms | 0.01ms | +0.0027ms | +21.36% |
| mean | 0.01ms | 0.01ms | -0.00026ms | -2.45% |
| min | 0.0094ms | 0.0098ms | -0.00042ms | -4.26% |
| max | 0.02ms | 0.01ms | +0.0035ms | +26.86% |
| total | 0.21ms | 0.21ms | -0.0052ms | -2.45% |

