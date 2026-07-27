# Perf Suite — i18n-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.10ms | 100ms | PASS | stable |
| locale_switch_batch (5 setLocale + translate) | 0.04ms | 100ms | PASS | stable |
| missing_key_error_handling (5 missing translations) | 0.00ms | 100ms | PASS | stable |
| retry_recovery (5 flaky async retry to success) | 0.04ms | 100ms | PASS | stable |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.38ms | 200ms | PASS |
| locale_switch_batch (5 setLocale + translate) | 0.16ms | 200ms | PASS |
| missing_key_error_handling (5 missing translations) | 0.02ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.12ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 14872 B | 0 B | 102400 B | yes | PASS |
| locale_switch_batch (5 setLocale + translate) | -18312 B | 0 B | 102400 B | yes | PASS |
| missing_key_error_handling (5 missing translations) | 6952 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 4864 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 1296 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### translation_workflow (10 translate across 4 providers)

# Perf Report — translation_workflow (10 translate across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.09ms |
| p95 | 0.10ms |
| p99 | 0.11ms |
| mean | 0.09ms |
| stdev | 0.01ms |
| min | 0.08ms |
| max | 0.11ms |
| total | 1.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.09ms | 0.10ms | -0.01ms | -8.57% |
| p95 | 0.10ms | 0.11ms | -0.01ms | -7.44% |
| p99 | 0.11ms | 0.11ms | -0.01ms | -4.64% |
| mean | 0.09ms | 0.10ms | -0.01ms | -7.48% |
| min | 0.08ms | 0.09ms | -0.01ms | -10.46% |
| max | 0.11ms | 0.11ms | -0.00ms | -3.96% |
| total | 1.82ms | 1.97ms | -0.15ms | -7.48% |

### locale_switch_batch (5 setLocale + translate)

# Perf Report — locale_switch_batch (5 setLocale + translate).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.00ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.01ms | -11.96% |
| p95 | 0.04ms | 0.06ms | -0.01ms | -20.80% |
| p99 | 0.05ms | 0.06ms | -0.01ms | -16.37% |
| mean | 0.04ms | 0.04ms | -0.01ms | -12.70% |
| min | 0.04ms | 0.04ms | -0.01ms | -13.65% |
| max | 0.05ms | 0.06ms | -0.01ms | -15.27% |
| total | 0.77ms | 0.88ms | -0.11ms | -12.70% |

### missing_key_error_handling (5 missing translations)

# Perf Report — missing_key_error_handling (5 missing translations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -15.66% |
| p95 | 0.00ms | 0.01ms | -0.00ms | -12.95% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +6.23% |
| mean | 0.00ms | 0.00ms | -0.00ms | -13.03% |
| min | 0.00ms | 0.00ms | -0.00ms | -16.68% |
| max | 0.01ms | 0.01ms | +0.00ms | +10.38% |
| total | 0.07ms | 0.09ms | -0.01ms | -13.03% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -10.44% |
| p95 | 0.04ms | 0.04ms | -0.01ms | -16.57% |
| p99 | 0.04ms | 0.05ms | -0.01ms | -17.91% |
| mean | 0.03ms | 0.03ms | -0.00ms | -14.18% |
| min | 0.03ms | 0.03ms | -0.00ms | -10.67% |
| max | 0.04ms | 0.05ms | -0.01ms | -18.21% |
| total | 0.59ms | 0.69ms | -0.10ms | -14.18% |

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
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -9.60% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -11.25% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -8.18% |
| mean | 0.01ms | 0.01ms | -0.00ms | -9.86% |
| min | 0.01ms | 0.01ms | -0.00ms | -7.76% |
| max | 0.02ms | 0.02ms | -0.00ms | -7.56% |
| total | 0.20ms | 0.22ms | -0.02ms | -9.86% |

