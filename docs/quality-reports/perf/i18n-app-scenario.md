# Perf Suite — i18n-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.11ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +331%) 以上の悪化が必要) |
| locale_switch_batch (5 setLocale + translate) | 0.05ms | 100ms | PASS | stable (差 0.21ms が下限 0.5ms 未満で判定を保留) |
| missing_key_error_handling (5 missing translations) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +9580%) 以上の悪化が必要) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1309%) 以上の悪化が必要) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +4106%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.36ms | 200ms | PASS |
| locale_switch_batch (5 setLocale + translate) | 0.15ms | 200ms | PASS |
| missing_key_error_handling (5 missing translations) | 0.03ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.12ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 8800 B | 0 B | 102400 B | yes | PASS |
| locale_switch_batch (5 setLocale + translate) | -20488 B | 0 B | 102400 B | yes | PASS |
| missing_key_error_handling (5 missing translations) | 6784 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 3664 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 584 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### translation_workflow (10 translate across 4 providers)

# Perf Report — translation_workflow (10 translate across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.09ms |
| p95 | 0.11ms |
| p99 | 0.11ms |
| mean | 0.09ms |
| stdev | 0.01ms |
| min | 0.08ms |
| max | 0.11ms |
| total | 1.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.09ms | 0.10ms | -0.01ms | -12.58% |
| p95 | 0.11ms | 0.15ms | -0.04ms | -29.22% |
| p99 | 0.11ms | 0.60ms | -0.48ms | -81.21% |
| mean | 0.09ms | 0.13ms | -0.04ms | -31.59% |
| min | 0.08ms | 0.09ms | -0.01ms | -10.05% |
| max | 0.11ms | 0.71ms | -0.59ms | -83.98% |
| total | 1.78ms | 2.60ms | -0.82ms | -31.59% |

### locale_switch_batch (5 setLocale + translate)

# Perf Report — locale_switch_batch (5 setLocale + translate).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.00ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.00ms | -8.63% |
| p95 | 0.05ms | 0.26ms | -0.21ms | -81.74% |
| p99 | 0.05ms | 2.18ms | -2.13ms | -97.77% |
| mean | 0.04ms | 0.18ms | -0.14ms | -77.85% |
| min | 0.04ms | 0.04ms | -0.00ms | -8.90% |
| max | 0.05ms | 2.66ms | -2.61ms | -98.15% |
| total | 0.79ms | 3.58ms | -2.78ms | -77.85% |

### missing_key_error_handling (5 missing translations)

# Perf Report — missing_key_error_handling (5 missing translations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.06% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +31.08% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +26.46% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.30% |
| min | 0.00ms | 0.00ms | -0.00ms | -10.47% |
| max | 0.01ms | 0.01ms | +0.00ms | +25.50% |
| total | 0.07ms | 0.08ms | -0.00ms | -3.30% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +4.39% |
| p95 | 0.03ms | 0.04ms | -0.00ms | -9.88% |
| p99 | 0.04ms | 0.04ms | -0.00ms | -2.55% |
| mean | 0.03ms | 0.03ms | +0.00ms | +2.96% |
| min | 0.03ms | 0.03ms | +0.00ms | +4.47% |
| max | 0.04ms | 0.04ms | -0.00ms | -0.75% |
| total | 0.58ms | 0.56ms | +0.02ms | +2.96% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -13.83% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -5.97% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -11.56% |
| mean | 0.01ms | 0.01ms | -0.00ms | -13.40% |
| min | 0.01ms | 0.01ms | -0.00ms | -13.33% |
| max | 0.01ms | 0.01ms | -0.00ms | -12.71% |
| total | 0.20ms | 0.23ms | -0.03ms | -13.40% |

