# Perf Suite — i18n-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.19ms | 100ms | PASS | stable |
| locale_switch_batch (5 setLocale + translate) | 0.05ms | 100ms | PASS | stable |
| missing_key_error_handling (5 missing translations) | 0.01ms | 100ms | PASS | stable |
| retry_recovery (5 flaky async retry to success) | 0.04ms | 100ms | PASS | stable |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.38ms | 200ms | PASS |
| locale_switch_batch (5 setLocale + translate) | 0.17ms | 200ms | PASS |
| missing_key_error_handling (5 missing translations) | 0.03ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 14016 B | 0 B | 102400 B | yes | PASS |
| locale_switch_batch (5 setLocale + translate) | -19488 B | 0 B | 102400 B | yes | PASS |
| missing_key_error_handling (5 missing translations) | 784 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 6112 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 1200 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### translation_workflow (10 translate across 4 providers)

# Perf Report — translation_workflow (10 translate across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.10ms |
| p95 | 0.19ms |
| p99 | 0.93ms |
| mean | 0.15ms |
| stdev | 0.23ms |
| min | 0.08ms |
| max | 1.11ms |
| total | 3.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.10ms | 0.10ms | +0.00ms | +4.97% |
| p95 | 0.19ms | 0.11ms | +0.08ms | +73.19% |
| p99 | 0.93ms | 0.11ms | +0.81ms | +714.92% |
| mean | 0.15ms | 0.10ms | +0.05ms | +55.05% |
| min | 0.08ms | 0.09ms | -0.00ms | -4.24% |
| max | 1.11ms | 0.11ms | +1.00ms | +870.21% |
| total | 3.06ms | 1.97ms | +1.09ms | +55.05% |

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
| total | 0.83ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.00ms | -4.59% |
| p95 | 0.05ms | 0.06ms | -0.01ms | -14.16% |
| p99 | 0.05ms | 0.06ms | -0.00ms | -6.44% |
| mean | 0.04ms | 0.04ms | -0.00ms | -5.82% |
| min | 0.04ms | 0.04ms | -0.00ms | -6.63% |
| max | 0.05ms | 0.06ms | -0.00ms | -4.51% |
| total | 0.83ms | 0.88ms | -0.05ms | -5.82% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.07% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +34.71% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +73.44% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.77% |
| min | 0.00ms | 0.00ms | -0.00ms | -7.30% |
| max | 0.01ms | 0.01ms | +0.01ms | +81.81% |
| total | 0.09ms | 0.09ms | +0.00ms | +2.77% |

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
| total | 0.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -5.65% |
| p95 | 0.04ms | 0.04ms | -0.01ms | -14.24% |
| p99 | 0.04ms | 0.05ms | -0.01ms | -21.39% |
| mean | 0.03ms | 0.03ms | -0.00ms | -8.98% |
| min | 0.03ms | 0.03ms | -0.00ms | -5.75% |
| max | 0.04ms | 0.05ms | -0.01ms | -22.98% |
| total | 0.63ms | 0.69ms | -0.06ms | -8.98% |

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
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +0.41% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -5.78% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -18.18% |
| mean | 0.01ms | 0.01ms | -0.00ms | -1.69% |
| min | 0.01ms | 0.01ms | +0.00ms | +4.75% |
| max | 0.01ms | 0.02ms | -0.00ms | -20.66% |
| total | 0.22ms | 0.22ms | -0.00ms | -1.69% |

