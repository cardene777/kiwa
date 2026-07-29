# Perf Suite — i18n-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.08ms | 0.12ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| locale_switch_batch (5 setLocale + translate) | 0.04ms | 0.05ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| missing_key_error_handling (5 missing translations) | 0.0034ms | 0.0096ms | 100ms | 0.00042ms | PASS | stable (p10 -12% (閾値未満)、 p95 +45% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0094ms | 0.01ms | 100ms | 0.00042ms | PASS | stable (p10 -5% (閾値未満)、 p95 +23% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

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
| translation_workflow (10 translate across 4 providers) | 1464 B | 0 B | 102400 B | yes | PASS |
| locale_switch_batch (5 setLocale + translate) | -3904 B | 0 B | 102400 B | yes | PASS |
| missing_key_error_handling (5 missing translations) | 6832 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 3728 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 3400 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### translation_workflow (10 translate across 4 providers)

# Perf Report — translation_workflow (10 translate across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.08ms |
| p50 | 0.09ms |
| p95 | 0.12ms |
| p99 | 0.12ms |
| mean | 0.09ms |
| stdev | 0.01ms |
| min | 0.08ms |
| max | 0.12ms |
| total | 1.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.08ms | 0.08ms | -0.0011ms | -1.26% |
| p50 | 0.09ms | 0.09ms | +0.0022ms | +2.51% |
| p95 | 0.12ms | 0.20ms | -0.08ms | -40.76% |
| p99 | 0.12ms | 0.28ms | -0.16ms | -57.87% |
| mean | 0.09ms | 0.11ms | -0.01ms | -13.79% |
| min | 0.08ms | 0.08ms | -0.0015ms | -1.81% |
| max | 0.12ms | 0.30ms | -0.18ms | -60.63% |
| total | 1.86ms | 2.16ms | -0.30ms | -13.79% |

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
| stdev | 0.0029ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.0012ms | -3.10% |
| p50 | 0.04ms | 0.04ms | -0.0014ms | -3.42% |
| p95 | 0.05ms | 0.05ms | -0.0098ms | -17.90% |
| p99 | 0.05ms | 0.06ms | -0.01ms | -19.11% |
| mean | 0.04ms | 0.04ms | -0.0026ms | -6.03% |
| min | 0.04ms | 0.04ms | -0.0017ms | -4.37% |
| max | 0.05ms | 0.06ms | -0.01ms | -19.38% |
| total | 0.81ms | 0.86ms | -0.05ms | -6.03% |

### missing_key_error_handling (5 missing translations)

# Perf Report — missing_key_error_handling (5 missing translations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0034ms |
| p50 | 0.0036ms |
| p95 | 0.0096ms |
| p99 | 0.01ms |
| mean | 0.0049ms |
| stdev | 0.0029ms |
| min | 0.0034ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0039ms | -0.00045ms | -11.75% |
| p50 | 0.0036ms | 0.0040ms | -0.00042ms | -10.48% |
| p95 | 0.0096ms | 0.0066ms | +0.0030ms | +44.80% |
| p99 | 0.01ms | 0.01ms | +0.0024ms | +20.65% |
| mean | 0.0049ms | 0.0047ms | +0.00019ms | +4.00% |
| min | 0.0034ms | 0.0038ms | -0.00042ms | -10.97% |
| max | 0.01ms | 0.01ms | +0.0022ms | +17.49% |
| total | 0.10ms | 0.09ms | +0.0037ms | +4.00% |

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
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0025ms | -8.30% |
| p50 | 0.03ms | 0.03ms | -0.0041ms | -12.67% |
| p95 | 0.04ms | 0.07ms | -0.03ms | -47.38% |
| p99 | 0.04ms | 0.08ms | -0.05ms | -55.55% |
| mean | 0.03ms | 0.04ms | -0.0086ms | -22.76% |
| min | 0.03ms | 0.03ms | -0.0023ms | -7.83% |
| max | 0.04ms | 0.09ms | -0.05ms | -57.12% |
| total | 0.59ms | 0.76ms | -0.17ms | -22.76% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0094ms |
| p50 | 0.0098ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0017ms |
| min | 0.0093ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0094ms | 0.0099ms | -0.00046ms | -4.64% |
| p50 | 0.0098ms | 0.01ms | -0.00063ms | -6.00% |
| p95 | 0.01ms | 0.01ms | +0.0028ms | +22.80% |
| p99 | 0.02ms | 0.01ms | +0.0026ms | +20.59% |
| mean | 0.01ms | 0.01ms | -0.00025ms | -2.37% |
| min | 0.0093ms | 0.0098ms | -0.00050ms | -5.12% |
| max | 0.02ms | 0.01ms | +0.0026ms | +20.06% |
| total | 0.21ms | 0.21ms | -0.0050ms | -2.37% |

