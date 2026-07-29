# Perf Suite — i18n-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.17ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +331%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| locale_switch_batch (5 setLocale + translate) | 0.30ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +195%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| missing_key_error_handling (5 missing translations) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +9580%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1309%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +4106%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.40ms | 200ms | PASS |
| locale_switch_batch (5 setLocale + translate) | 0.19ms | 200ms | PASS |
| missing_key_error_handling (5 missing translations) | 0.04ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 13920 B | -14378 B | 102400 B | yes | PASS |
| locale_switch_batch (5 setLocale + translate) | -56 B | 0 B | 102400 B | yes | PASS |
| missing_key_error_handling (5 missing translations) | 1440 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 832 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 5904 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### translation_workflow (10 translate across 4 providers)

# Perf Report — translation_workflow (10 translate across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.10ms |
| p95 | 0.17ms |
| p99 | 0.49ms |
| mean | 0.13ms |
| stdev | 0.10ms |
| min | 0.09ms |
| max | 0.57ms |
| total | 2.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.10ms | 0.10ms | +0.01ms | +6.70% |
| p95 | 0.17ms | 0.15ms | +0.02ms | +12.13% |
| p99 | 0.49ms | 0.60ms | -0.11ms | -18.26% |
| mean | 0.13ms | 0.13ms | -0.00ms | -0.76% |
| min | 0.09ms | 0.09ms | +0.01ms | +7.07% |
| max | 0.57ms | 0.71ms | -0.14ms | -19.88% |
| total | 2.58ms | 2.60ms | -0.02ms | -0.76% |

### locale_switch_batch (5 setLocale + translate)

# Perf Report — locale_switch_batch (5 setLocale + translate).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.08ms |
| p95 | 0.30ms |
| p99 | 0.51ms |
| mean | 0.13ms |
| stdev | 0.13ms |
| min | 0.04ms |
| max | 0.56ms |
| total | 2.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.08ms | 0.04ms | +0.04ms | +86.95% |
| p95 | 0.30ms | 0.26ms | +0.04ms | +16.62% |
| p99 | 0.51ms | 2.18ms | -1.67ms | -76.79% |
| mean | 0.13ms | 0.18ms | -0.05ms | -28.38% |
| min | 0.04ms | 0.04ms | +0.00ms | +8.49% |
| max | 0.56ms | 2.66ms | -2.10ms | -79.04% |
| total | 2.56ms | 3.58ms | -1.02ms | -28.38% |

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
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +14.36% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +6.06% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +32.65% |
| mean | 0.00ms | 0.00ms | +0.00ms | +15.50% |
| min | 0.00ms | 0.00ms | +0.00ms | +12.78% |
| max | 0.01ms | 0.01ms | +0.00ms | +38.23% |
| total | 0.09ms | 0.08ms | +0.01ms | +15.50% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -0.94% |
| p95 | 0.03ms | 0.04ms | -0.01ms | -15.19% |
| p99 | 0.03ms | 0.04ms | -0.00ms | -10.57% |
| mean | 0.03ms | 0.03ms | -0.00ms | -3.40% |
| min | 0.03ms | 0.03ms | +0.00ms | +0.16% |
| max | 0.04ms | 0.04ms | -0.00ms | -9.43% |
| total | 0.55ms | 0.56ms | -0.02ms | -3.40% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -0.55% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +34.33% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +17.35% |
| mean | 0.01ms | 0.01ms | +0.00ms | +4.31% |
| min | 0.01ms | 0.01ms | +0.00ms | +0.40% |
| max | 0.02ms | 0.01ms | +0.00ms | +13.84% |
| total | 0.24ms | 0.23ms | +0.01ms | +4.31% |

