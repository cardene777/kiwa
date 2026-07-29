# Perf Suite — i18n-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.08ms | 0.11ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| locale_switch_batch (5 setLocale + translate) | 0.04ms | 0.05ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| missing_key_error_handling (5 missing translations) | 0.0033ms | 0.0097ms | 100ms | 0.00050ms | PASS | stable (p10 -14% (閾値未満)、 p95 +47% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.37ms | 200ms | PASS |
| locale_switch_batch (5 setLocale + translate) | 0.15ms | 200ms | PASS |
| missing_key_error_handling (5 missing translations) | 0.02ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 2568 B | 0 B | 102400 B | yes | PASS |
| locale_switch_batch (5 setLocale + translate) | -4784 B | 0 B | 102400 B | yes | PASS |
| missing_key_error_handling (5 missing translations) | 584 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 3728 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 3752 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### translation_workflow (10 translate across 4 providers)

# Perf Report — translation_workflow (10 translate across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.08ms |
| p50 | 0.09ms |
| p95 | 0.11ms |
| p99 | 0.11ms |
| mean | 0.09ms |
| stdev | 0.01ms |
| min | 0.08ms |
| max | 0.11ms |
| total | 1.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.08ms | 0.08ms | -0.0033ms | -3.97% |
| p50 | 0.09ms | 0.09ms | -0.0012ms | -1.36% |
| p95 | 0.11ms | 0.20ms | -0.09ms | -44.73% |
| p99 | 0.11ms | 0.28ms | -0.17ms | -59.90% |
| mean | 0.09ms | 0.11ms | -0.02ms | -17.03% |
| min | 0.08ms | 0.08ms | -0.0047ms | -5.67% |
| max | 0.11ms | 0.30ms | -0.19ms | -62.34% |
| total | 1.79ms | 2.16ms | -0.37ms | -17.03% |

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
| stdev | 0.0032ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.0024ms | -6.03% |
| p50 | 0.04ms | 0.04ms | -0.0030ms | -7.44% |
| p95 | 0.05ms | 0.05ms | -0.0095ms | -17.31% |
| p99 | 0.05ms | 0.06ms | -0.01ms | -23.96% |
| mean | 0.04ms | 0.04ms | -0.0036ms | -8.41% |
| min | 0.04ms | 0.04ms | -0.0022ms | -5.54% |
| max | 0.05ms | 0.06ms | -0.02ms | -25.41% |
| total | 0.79ms | 0.86ms | -0.07ms | -8.41% |

### missing_key_error_handling (5 missing translations)

# Perf Report — missing_key_error_handling (5 missing translations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0033ms |
| p50 | 0.0035ms |
| p95 | 0.0097ms |
| p99 | 0.01ms |
| mean | 0.0046ms |
| stdev | 0.0027ms |
| min | 0.0032ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0033ms | 0.0039ms | -0.00054ms | -14.00% |
| p50 | 0.0035ms | 0.0040ms | -0.00048ms | -12.05% |
| p95 | 0.0097ms | 0.0066ms | +0.0031ms | +46.59% |
| p99 | 0.01ms | 0.01ms | +0.0017ms | +15.02% |
| mean | 0.0046ms | 0.0047ms | -0.000046ms | -0.98% |
| min | 0.0032ms | 0.0038ms | -0.00054ms | -14.27% |
| max | 0.01ms | 0.01ms | +0.0014ms | +10.89% |
| total | 0.09ms | 0.09ms | -0.00092ms | -0.98% |

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
| stdev | 0.0026ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0026ms | -8.51% |
| p50 | 0.03ms | 0.03ms | -0.0043ms | -13.05% |
| p95 | 0.03ms | 0.07ms | -0.03ms | -49.64% |
| p99 | 0.04ms | 0.08ms | -0.05ms | -55.75% |
| mean | 0.03ms | 0.04ms | -0.0089ms | -23.50% |
| min | 0.03ms | 0.03ms | -0.0026ms | -8.67% |
| max | 0.04ms | 0.09ms | -0.05ms | -56.93% |
| total | 0.58ms | 0.76ms | -0.18ms | -23.50% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.0010ms |
| min | 0.01ms |
| max | 0.01ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0099ms | +0.0017ms | +16.79% |
| p50 | 0.01ms | 0.01ms | +0.0016ms | +15.01% |
| p95 | 0.01ms | 0.01ms | +0.0024ms | +19.91% |
| p99 | 0.01ms | 0.01ms | +0.0020ms | +15.59% |
| mean | 0.01ms | 0.01ms | +0.0017ms | +16.22% |
| min | 0.01ms | 0.0098ms | +0.0015ms | +15.32% |
| max | 0.01ms | 0.01ms | +0.0019ms | +14.56% |
| total | 0.25ms | 0.21ms | +0.03ms | +16.22% |

