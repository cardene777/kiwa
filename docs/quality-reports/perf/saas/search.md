# Perf Suite — search

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| meiliSearchQuery | 0.03ms | 10ms | PASS | stable |
| algoliaSearchQuery | 0.01ms | 10ms | PASS | stable |
| typesenseSearchQuery | 0.01ms | 10ms | PASS | stable |
| meiliAddDocuments | 0.00ms | 10ms | PASS | stable |
| algoliaAddDocuments | 0.00ms | 10ms | PASS | stable |
| typesenseAddDocuments | 0.00ms | 10ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| meiliSearchQuery | 0.17ms | 20ms | PASS |
| algoliaSearchQuery | 0.13ms | 20ms | PASS |
| typesenseSearchQuery | 0.13ms | 20ms | PASS |
| meiliAddDocuments | 0.01ms | 20ms | PASS |
| algoliaAddDocuments | 0.01ms | 20ms | PASS |
| typesenseAddDocuments | 0.01ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| meiliSearchQuery | -8136 B | 0 B | 102400 B | yes | PASS |
| algoliaSearchQuery | 640 B | 0 B | 102400 B | yes | PASS |
| typesenseSearchQuery | 2760 B | 0 B | 102400 B | yes | PASS |
| meiliAddDocuments | 15312 B | 0 B | 102400 B | yes | PASS |
| algoliaAddDocuments | 17040 B | 0 B | 102400 B | yes | PASS |
| typesenseAddDocuments | 14472 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### meiliSearchQuery

# Perf Report — meiliSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.28ms |
| total | 3.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +3.32% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -1.01% |
| p99 | 0.04ms | 0.05ms | -0.01ms | -25.38% |
| mean | 0.02ms | 0.02ms | +0.00ms | +4.02% |
| min | 0.01ms | 0.01ms | -0.00ms | -0.42% |
| max | 0.28ms | 0.21ms | +0.07ms | +32.55% |
| total | 3.62ms | 3.48ms | +0.14ms | +4.02% |

### algoliaSearchQuery

# Perf Report — algoliaSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.09ms |
| total | 1.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +0.30% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -3.00% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -28.10% |
| mean | 0.01ms | 0.01ms | -0.00ms | -1.27% |
| min | 0.01ms | 0.01ms | 0.00ms | 0.00% |
| max | 0.09ms | 0.09ms | -0.01ms | -5.86% |
| total | 1.54ms | 1.56ms | -0.02ms | -1.27% |

### typesenseSearchQuery

# Perf Report — typesenseSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.08ms |
| total | 1.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +11.11% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -7.14% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +0.81% |
| mean | 0.01ms | 0.01ms | +0.00ms | +6.06% |
| min | 0.01ms | 0.01ms | +0.00ms | +5.86% |
| max | 0.08ms | 0.12ms | -0.03ms | -27.54% |
| total | 1.61ms | 1.52ms | +0.09ms | +6.06% |

### meiliAddDocuments

# Perf Report — meiliAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +12.10% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +1.89% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.84% |
| min | 0.00ms | 0.00ms | +0.00ms | +12.61% |
| max | 0.01ms | 0.01ms | +0.00ms | +25.00% |
| total | 0.10ms | 0.10ms | +0.00ms | +1.84% |

### algoliaAddDocuments

# Perf Report — algoliaAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +36.19% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +71.75% |
| mean | 0.00ms | 0.00ms | +0.00ms | +18.17% |
| min | 0.00ms | 0.00ms | -0.00ms | -14.09% |
| max | 0.01ms | 0.01ms | +0.01ms | +96.89% |
| total | 0.10ms | 0.09ms | +0.02ms | +18.17% |

### typesenseAddDocuments

# Perf Report — typesenseAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.30% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -5.96% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +42.99% |
| mean | 0.00ms | 0.00ms | +0.00ms | +9.81% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.00ms | +0.00ms | +163.11% |
| total | 0.09ms | 0.08ms | +0.01ms | +9.81% |

