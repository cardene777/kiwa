# Perf Suite — i18n-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.12ms | 100ms | PASS | stable |
| locale_switch_batch (5 setLocale + translate) | 0.06ms | 100ms | PASS | regressed |
| missing_key_error_handling (5 missing translations) | 0.01ms | 100ms | PASS | stable |
| retry_recovery (5 flaky async retry to success) | 0.04ms | 100ms | PASS | n/a (baseline seeded) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 100ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 0.42ms | 200ms | PASS |
| locale_switch_batch (5 setLocale + translate) | 0.19ms | 200ms | PASS |
| missing_key_error_handling (5 missing translations) | 0.02ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.26ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| translation_workflow (10 translate across 4 providers) | 965680 B | 0 B | 102400 B | PASS |
| locale_switch_batch (5 setLocale + translate) | 279304 B | 0 B | 102400 B | PASS |
| missing_key_error_handling (5 missing translations) | 124712 B | 0 B | 102400 B | PASS |
| retry_recovery (5 flaky async retry to success) | 557880 B | 0 B | 102400 B | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 662304 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### translation_workflow (10 translate across 4 providers)

# Perf Report — translation_workflow (10 translate across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.09ms |
| p95 | 0.12ms |
| p99 | 0.12ms |
| mean | 0.10ms |
| stdev | 0.01ms |
| min | 0.09ms |
| max | 0.12ms |
| total | 1.93ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.09ms | 0.09ms | +0.00ms | +5.17% |
| p95 | 0.12ms | 0.15ms | -0.03ms | -21.93% |
| p99 | 0.12ms | 0.18ms | -0.06ms | -34.48% |
| mean | 0.10ms | 0.10ms | -0.00ms | -1.27% |
| min | 0.09ms | 0.08ms | +0.00ms | +5.66% |
| max | 0.12ms | 0.19ms | -0.07ms | -37.01% |
| total | 1.93ms | 1.95ms | -0.02ms | -1.27% |

### locale_switch_batch (5 setLocale + translate)

# Perf Report — locale_switch_batch (5 setLocale + translate).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.05ms |
| p95 | 0.06ms |
| p99 | 0.06ms |
| mean | 0.05ms |
| stdev | 0.00ms |
| min | 0.05ms |
| max | 0.07ms |
| total | 1.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.04ms | +0.01ms | +38.68% |
| p95 | 0.06ms | 0.04ms | +0.02ms | +36.85% |
| p99 | 0.06ms | 0.05ms | +0.02ms | +37.24% |
| mean | 0.05ms | 0.04ms | +0.01ms | +36.35% |
| min | 0.05ms | 0.04ms | +0.01ms | +30.86% |
| max | 0.07ms | 0.05ms | +0.02ms | +37.33% |
| total | 1.03ms | 0.76ms | +0.28ms | +36.35% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +4.79% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +1.59% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +24.35% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.37% |
| min | 0.00ms | 0.00ms | +0.00ms | +7.63% |
| max | 0.01ms | 0.01ms | +0.00ms | +29.66% |
| total | 0.08ms | 0.08ms | -0.00ms | -0.37% |

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
| total | 0.68ms |

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

