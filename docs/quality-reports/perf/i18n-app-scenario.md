# Perf Suite — i18n-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.11ms | 100ms | PASS | stable |
| locale_switch_batch (5 setLocale + translate) | 0.05ms | 100ms | PASS | stable |
| missing_key_error_handling (5 missing translations) | 0.01ms | 100ms | PASS | stable |
| retry_recovery (5 flaky async retry to success) | 0.15ms | 100ms | PASS | stable |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.37ms | 200ms | PASS |
| locale_switch_batch (5 setLocale + translate) | 0.16ms | 200ms | PASS |
| missing_key_error_handling (5 missing translations) | 0.03ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 15552 B | 0 B | 102400 B | yes | PASS |
| locale_switch_batch (5 setLocale + translate) | -18856 B | 0 B | 102400 B | yes | PASS |
| missing_key_error_handling (5 missing translations) | 6952 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 4528 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 984 B | 0 B | 102400 B | yes | PASS |

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
| total | 1.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.09ms | 0.10ms | -0.01ms | -11.02% |
| p95 | 0.11ms | 0.11ms | -0.00ms | -1.84% |
| p99 | 0.11ms | 0.11ms | -0.00ms | -2.90% |
| mean | 0.09ms | 0.10ms | -0.01ms | -8.77% |
| min | 0.08ms | 0.09ms | -0.01ms | -10.65% |
| max | 0.11ms | 0.11ms | -0.00ms | -3.16% |
| total | 1.80ms | 1.97ms | -0.17ms | -8.77% |

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
| total | 0.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.00ms | -8.00% |
| p95 | 0.05ms | 0.06ms | -0.01ms | -10.59% |
| p99 | 0.05ms | 0.06ms | -0.00ms | -3.80% |
| mean | 0.04ms | 0.04ms | -0.00ms | -8.21% |
| min | 0.04ms | 0.04ms | -0.01ms | -12.36% |
| max | 0.05ms | 0.06ms | -0.00ms | -2.11% |
| total | 0.81ms | 0.88ms | -0.07ms | -8.21% |

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
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -14.13% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +28.16% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +60.53% |
| mean | 0.00ms | 0.00ms | -0.00ms | -2.66% |
| min | 0.00ms | 0.00ms | -0.00ms | -14.58% |
| max | 0.01ms | 0.01ms | +0.00ms | +67.52% |
| total | 0.08ms | 0.09ms | -0.00ms | -2.66% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.15ms |
| p99 | 0.15ms |
| mean | 0.07ms |
| stdev | 0.04ms |
| min | 0.03ms |
| max | 0.16ms |
| total | 1.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.03ms | +0.01ms | +32.11% |
| p95 | 0.15ms | 0.04ms | +0.10ms | +243.45% |
| p99 | 0.15ms | 0.05ms | +0.11ms | +228.84% |
| mean | 0.07ms | 0.03ms | +0.03ms | +88.92% |
| min | 0.03ms | 0.03ms | -0.00ms | -11.77% |
| max | 0.16ms | 0.05ms | +0.11ms | +225.59% |
| total | 1.31ms | 0.69ms | +0.62ms | +88.92% |

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
| p50 | 0.01ms | 0.01ms | -0.00ms | -6.80% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -18.68% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -16.55% |
| mean | 0.01ms | 0.01ms | -0.00ms | -8.87% |
| min | 0.01ms | 0.01ms | -0.00ms | -4.74% |
| max | 0.01ms | 0.02ms | -0.00ms | -16.12% |
| total | 0.20ms | 0.22ms | -0.02ms | -8.87% |

