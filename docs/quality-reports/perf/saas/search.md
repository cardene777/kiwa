# Perf Suite — search

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| meiliSearchQuery | 0.03ms | 10ms | PASS | n/a (baseline seeded) |
| algoliaSearchQuery | 0.01ms | 10ms | PASS | n/a (baseline seeded) |
| typesenseSearchQuery | 0.01ms | 10ms | PASS | n/a (baseline seeded) |
| meiliAddDocuments | 0.00ms | 10ms | PASS | n/a (baseline seeded) |
| algoliaAddDocuments | 0.00ms | 10ms | PASS | n/a (baseline seeded) |
| typesenseAddDocuments | 0.00ms | 10ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| meiliSearchQuery | 0.13ms | 20ms | PASS |
| algoliaSearchQuery | 0.11ms | 20ms | PASS |
| typesenseSearchQuery | 0.11ms | 20ms | PASS |
| meiliAddDocuments | 0.01ms | 20ms | PASS |
| algoliaAddDocuments | 0.01ms | 20ms | PASS |
| typesenseAddDocuments | 0.01ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| meiliSearchQuery | 1055384 B | 0 B | 102400 B | PASS |
| algoliaSearchQuery | 980672 B | 0 B | 102400 B | PASS |
| typesenseSearchQuery | 965952 B | 0 B | 102400 B | PASS |
| meiliAddDocuments | 336464 B | 0 B | 102400 B | PASS |
| algoliaAddDocuments | 336800 B | 0 B | 102400 B | PASS |
| typesenseAddDocuments | 336656 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### meiliSearchQuery

# Perf Report — meiliSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.39ms |
| total | 3.23ms |

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
| total | 1.51ms |

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
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 1.34ms |

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
| total | 0.09ms |

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
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.08ms |
| total | 0.17ms |

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
| max | 0.00ms |
| total | 0.07ms |

