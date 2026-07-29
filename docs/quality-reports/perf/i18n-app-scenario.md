# Perf Suite — i18n-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.08ms | 0.11ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| locale_switch_batch (5 setLocale + translate) | 0.04ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| missing_key_error_handling (5 missing translations) | 0.0034ms | 0.01ms | 100ms | 0.00050ms | PASS | stable (p10 -12% (閾値未満)、 p95 +63% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0098ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.37ms | 200ms | PASS |
| locale_switch_batch (5 setLocale + translate) | 0.16ms | 200ms | PASS |
| missing_key_error_handling (5 missing translations) | 0.02ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 1384 B | 0 B | 102400 B | yes | PASS |
| locale_switch_batch (5 setLocale + translate) | -4864 B | 0 B | 102400 B | yes | PASS |
| missing_key_error_handling (5 missing translations) | 6656 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 3392 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 7168 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.11ms |
| mean | 0.09ms |
| stdev | 0.01ms |
| min | 0.08ms |
| max | 0.12ms |
| total | 1.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.08ms | 0.08ms | -0.0029ms | -3.45% |
| p50 | 0.08ms | 0.09ms | -0.0029ms | -3.32% |
| p95 | 0.11ms | 0.20ms | -0.08ms | -42.03% |
| p99 | 0.11ms | 0.28ms | -0.17ms | -59.33% |
| mean | 0.09ms | 0.11ms | -0.02ms | -16.23% |
| min | 0.08ms | 0.08ms | -0.0076ms | -9.13% |
| max | 0.12ms | 0.30ms | -0.19ms | -62.12% |
| total | 1.81ms | 2.16ms | -0.35ms | -16.23% |

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
| stdev | 0.0021ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.0029ms | -7.31% |
| p50 | 0.04ms | 0.04ms | -0.0031ms | -7.50% |
| p95 | 0.04ms | 0.05ms | -0.01ms | -25.39% |
| p99 | 0.04ms | 0.06ms | -0.02ms | -26.61% |
| mean | 0.04ms | 0.04ms | -0.0049ms | -11.27% |
| min | 0.04ms | 0.04ms | -0.0026ms | -6.60% |
| max | 0.05ms | 0.06ms | -0.02ms | -26.87% |
| total | 0.76ms | 0.86ms | -0.10ms | -11.27% |

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
| p10 | 0.0034ms | 0.0039ms | -0.00045ms | -11.72% |
| p50 | 0.0035ms | 0.0040ms | -0.00048ms | -12.05% |
| p95 | 0.01ms | 0.0066ms | +0.0042ms | +63.26% |
| p99 | 0.01ms | 0.01ms | +0.0018ms | +16.07% |
| mean | 0.0046ms | 0.0047ms | -0.000098ms | -2.09% |
| min | 0.0034ms | 0.0038ms | -0.00042ms | -10.97% |
| max | 0.01ms | 0.01ms | +0.0012ms | +9.90% |
| total | 0.09ms | 0.09ms | -0.0020ms | -2.09% |

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
| stdev | 0.0029ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0027ms | -9.01% |
| p50 | 0.03ms | 0.03ms | -0.0045ms | -13.76% |
| p95 | 0.04ms | 0.07ms | -0.03ms | -46.90% |
| p99 | 0.04ms | 0.08ms | -0.05ms | -55.19% |
| mean | 0.03ms | 0.04ms | -0.0089ms | -23.51% |
| min | 0.03ms | 0.03ms | -0.0027ms | -9.23% |
| max | 0.04ms | 0.09ms | -0.05ms | -56.79% |
| total | 0.58ms | 0.76ms | -0.18ms | -23.51% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0098ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00083ms |
| min | 0.0098ms |
| max | 0.01ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0098ms | 0.0099ms | -0.000083ms | -0.84% |
| p50 | 0.01ms | 0.01ms | -0.00035ms | -3.39% |
| p95 | 0.01ms | 0.01ms | -0.0010ms | -8.23% |
| p99 | 0.01ms | 0.01ms | +0.00020ms | +1.56% |
| mean | 0.01ms | 0.01ms | -0.00027ms | -2.56% |
| min | 0.0098ms | 0.0098ms | -0.0000010ms | -0.01% |
| max | 0.01ms | 0.01ms | +0.00050ms | +3.88% |
| total | 0.21ms | 0.21ms | -0.0055ms | -2.56% |

