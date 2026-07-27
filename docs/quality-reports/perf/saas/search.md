# Perf Suite — search

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

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
| meiliSearchQuery | 0.14ms | 20ms | PASS |
| algoliaSearchQuery | 0.12ms | 20ms | PASS |
| typesenseSearchQuery | 0.11ms | 20ms | PASS |
| meiliAddDocuments | 0.02ms | 20ms | PASS |
| algoliaAddDocuments | 0.01ms | 20ms | PASS |
| typesenseAddDocuments | 0.01ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| meiliSearchQuery | -8008 B | 0 B | 102400 B | yes | PASS |
| algoliaSearchQuery | 720 B | 0 B | 102400 B | yes | PASS |
| typesenseSearchQuery | 2760 B | 0 B | 102400 B | yes | PASS |
| meiliAddDocuments | 15344 B | 0 B | 102400 B | yes | PASS |
| algoliaAddDocuments | 17040 B | 0 B | 102400 B | yes | PASS |
| typesenseAddDocuments | 14472 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### meiliSearchQuery

# Perf Report — meiliSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.29ms |
| total | 3.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.00ms | +4.62% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +9.30% |
| p99 | 0.08ms | 0.05ms | +0.03ms | +58.39% |
| mean | 0.02ms | 0.02ms | +0.00ms | +9.10% |
| min | 0.01ms | 0.01ms | +0.00ms | +0.85% |
| max | 0.29ms | 0.21ms | +0.08ms | +37.46% |
| total | 3.79ms | 3.48ms | +0.32ms | +9.10% |

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
| max | 0.08ms |
| total | 1.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -2.65% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +1.99% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -38.81% |
| mean | 0.01ms | 0.01ms | -0.00ms | -2.84% |
| min | 0.01ms | 0.01ms | -0.00ms | -1.84% |
| max | 0.08ms | 0.09ms | -0.01ms | -6.73% |
| total | 1.52ms | 1.56ms | -0.04ms | -2.84% |

### typesenseSearchQuery

# Perf Report — typesenseSearchQuery.serial

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
| max | 0.11ms |
| total | 1.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -1.85% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -16.18% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -15.68% |
| mean | 0.01ms | 0.01ms | -0.00ms | -2.97% |
| min | 0.01ms | 0.01ms | +0.00ms | +0.02% |
| max | 0.11ms | 0.12ms | -0.00ms | -2.62% |
| total | 1.47ms | 1.52ms | -0.05ms | -2.97% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -10.07% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +0.49% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -8.07% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.15% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +36.19% |
| total | 0.10ms | 0.10ms | -0.00ms | -3.15% |

### algoliaAddDocuments

# Perf Report — algoliaAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.06ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.30% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +22.67% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +187.75% |
| mean | 0.00ms | 0.00ms | +0.00ms | +82.89% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.06ms | 0.01ms | +0.05ms | +995.35% |
| total | 0.16ms | 0.09ms | +0.07ms | +82.89% |

### typesenseAddDocuments

# Perf Report — typesenseAddDocuments.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.30% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +3.74% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +298.39% |
| mean | 0.00ms | 0.00ms | +0.00ms | +38.38% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.00ms | +0.01ms | +504.69% |
| total | 0.11ms | 0.08ms | +0.03ms | +38.38% |

