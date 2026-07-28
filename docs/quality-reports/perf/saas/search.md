# Perf Suite — search

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| meiliSearchQuery | 0.03ms | 10ms | PASS | stable (差 0.06ms が下限 0.5ms 未満で判定を保留) |
| algoliaSearchQuery | 0.01ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +5513%) 以上の悪化が必要) |
| typesenseSearchQuery | 0.01ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +5405%) 以上の悪化が必要) |
| meiliAddDocuments | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +70413%) 以上の悪化が必要) |
| algoliaAddDocuments | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +85756%) 以上の悪化が必要) |
| typesenseAddDocuments | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +74733%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| meiliSearchQuery | 0.20ms | 20ms | PASS |
| algoliaSearchQuery | 0.15ms | 20ms | PASS |
| typesenseSearchQuery | 0.13ms | 20ms | PASS |
| meiliAddDocuments | 0.01ms | 20ms | PASS |
| algoliaAddDocuments | 0.01ms | 20ms | PASS |
| typesenseAddDocuments | 0.01ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| meiliSearchQuery | -5752 B | 0 B | 102400 B | yes | PASS |
| algoliaSearchQuery | -16352 B | 0 B | 102400 B | yes | PASS |
| typesenseSearchQuery | 4504 B | 0 B | 102400 B | yes | PASS |
| meiliAddDocuments | 14008 B | 0 B | 102400 B | yes | PASS |
| algoliaAddDocuments | 15248 B | 0 B | 102400 B | yes | PASS |
| typesenseAddDocuments | 14272 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.01ms | 0.02ms | -0.00ms | -7.82% |
| p95 | 0.03ms | 0.09ms | -0.06ms | -68.50% |
| p99 | 0.04ms | 0.32ms | -0.28ms | -86.33% |
| mean | 0.02ms | 0.03ms | -0.01ms | -44.42% |
| min | 0.01ms | 0.01ms | -0.00ms | -5.28% |
| max | 0.28ms | 0.63ms | -0.35ms | -55.70% |
| total | 3.62ms | 6.52ms | -2.90ms | -44.42% |

### algoliaSearchQuery

# Perf Report — algoliaSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.13ms |
| total | 1.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -5.47% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +0.75% |
| p99 | 0.03ms | 0.01ms | +0.01ms | +107.88% |
| mean | 0.01ms | 0.01ms | +0.00ms | +6.92% |
| min | 0.01ms | 0.01ms | -0.00ms | -4.57% |
| max | 0.13ms | 0.09ms | +0.04ms | +44.77% |
| total | 1.78ms | 1.66ms | +0.11ms | +6.92% |

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
| max | 0.10ms |
| total | 1.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -7.74% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -17.45% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -59.18% |
| mean | 0.01ms | 0.01ms | -0.00ms | -15.72% |
| min | 0.01ms | 0.01ms | -0.00ms | -9.53% |
| max | 0.10ms | 0.12ms | -0.01ms | -12.33% |
| total | 1.50ms | 1.78ms | -0.28ms | -15.72% |

### meiliAddDocuments

# Perf Report — meiliAddDocuments.serial

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
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.24% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +6.79% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +108.66% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.31% |
| min | 0.00ms | 0.00ms | -0.00ms | -11.20% |
| max | 0.01ms | 0.01ms | -0.00ms | -7.00% |
| total | 0.11ms | 0.10ms | +0.01ms | +5.31% |

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
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -10.93% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -7.04% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -4.20% |
| mean | 0.00ms | 0.00ms | -0.00ms | -9.88% |
| min | 0.00ms | 0.00ms | -0.00ms | -12.61% |
| max | 0.01ms | 0.01ms | -0.00ms | -18.50% |
| total | 0.08ms | 0.09ms | -0.01ms | -9.88% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -10.93% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -12.55% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +45.23% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.46% |
| min | 0.00ms | 0.00ms | -0.00ms | -12.61% |
| max | 0.01ms | 0.00ms | +0.01ms | +190.81% |
| total | 0.09ms | 0.09ms | +0.01ms | +7.46% |

