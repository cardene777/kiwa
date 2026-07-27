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
| meiliSearchQuery | 0.13ms | 20ms | PASS |
| algoliaSearchQuery | 0.13ms | 20ms | PASS |
| typesenseSearchQuery | 0.12ms | 20ms | PASS |
| meiliAddDocuments | 0.01ms | 20ms | PASS |
| algoliaAddDocuments | 0.01ms | 20ms | PASS |
| typesenseAddDocuments | 0.01ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| meiliSearchQuery | -7936 B | 0 B | 102400 B | yes | PASS |
| algoliaSearchQuery | 640 B | 0 B | 102400 B | yes | PASS |
| typesenseSearchQuery | 4704 B | 0 B | 102400 B | yes | PASS |
| meiliAddDocuments | 15312 B | 0 B | 102400 B | yes | PASS |
| algoliaAddDocuments | 17040 B | 0 B | 102400 B | yes | PASS |
| typesenseAddDocuments | 15928 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.27ms |
| total | 3.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +2.16% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +8.30% |
| p99 | 0.04ms | 0.05ms | -0.01ms | -19.37% |
| mean | 0.02ms | 0.02ms | +0.00ms | +4.57% |
| min | 0.01ms | 0.01ms | -0.00ms | -1.27% |
| max | 0.27ms | 0.21ms | +0.06ms | +30.87% |
| total | 3.63ms | 3.48ms | +0.16ms | +4.57% |

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
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.07ms |
| total | 1.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -2.34% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +6.09% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -28.94% |
| mean | 0.01ms | 0.01ms | -0.00ms | -3.68% |
| min | 0.01ms | 0.01ms | -0.00ms | -3.06% |
| max | 0.07ms | 0.09ms | -0.02ms | -27.40% |
| total | 1.50ms | 1.56ms | -0.06ms | -3.68% |

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
| max | 0.09ms |
| total | 1.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -2.46% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -7.64% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -4.29% |
| mean | 0.01ms | 0.01ms | -0.00ms | -3.97% |
| min | 0.01ms | 0.01ms | -0.00ms | -3.23% |
| max | 0.09ms | 0.12ms | -0.02ms | -21.15% |
| total | 1.46ms | 1.52ms | -0.06ms | -3.97% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.24% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -12.23% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -6.04% |
| mean | 0.00ms | 0.00ms | -0.00ms | -2.48% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +25.66% |
| total | 0.10ms | 0.10ms | -0.00ms | -2.48% |

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
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.30% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +7.91% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -8.29% |
| mean | 0.00ms | 0.00ms | +0.00ms | +4.43% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +48.84% |
| total | 0.09ms | 0.09ms | +0.00ms | +4.43% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -5.96% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +215.88% |
| mean | 0.00ms | 0.00ms | +0.00ms | +15.08% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.00ms | +0.00ms | +150.81% |
| total | 0.09ms | 0.08ms | +0.01ms | +15.08% |

