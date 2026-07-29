# Perf Suite — search

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| meiliSearchQuery | 0.07ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +581%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| algoliaSearchQuery | 0.01ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +5513%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| typesenseSearchQuery | 0.01ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +5405%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| meiliAddDocuments | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +70413%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| algoliaAddDocuments | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +85756%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| typesenseAddDocuments | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +74733%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| meiliSearchQuery | 1.26ms | 20ms | PASS |
| algoliaSearchQuery | 3.81ms | 20ms | PASS |
| typesenseSearchQuery | 0.21ms | 20ms | PASS |
| meiliAddDocuments | 0.01ms | 20ms | PASS |
| algoliaAddDocuments | 0.01ms | 20ms | PASS |
| typesenseAddDocuments | 0.01ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| meiliSearchQuery | -8632 B | -518 B | 102400 B | yes | PASS |
| algoliaSearchQuery | -728 B | 0 B | 102400 B | yes | PASS |
| typesenseSearchQuery | 2656 B | 0 B | 102400 B | yes | PASS |
| meiliAddDocuments | 35168 B | 0 B | 102400 B | yes | PASS |
| algoliaAddDocuments | 19096 B | 0 B | 102400 B | yes | PASS |
| typesenseAddDocuments | 25184 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### meiliSearchQuery

# Perf Report — meiliSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.07ms |
| p99 | 0.65ms |
| mean | 0.04ms |
| stdev | 0.09ms |
| min | 0.01ms |
| max | 0.82ms |
| total | 7.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +7.31% |
| p95 | 0.07ms | 0.09ms | -0.01ms | -15.01% |
| p99 | 0.65ms | 0.32ms | +0.33ms | +102.72% |
| mean | 0.04ms | 0.03ms | +0.01ms | +15.84% |
| min | 0.01ms | 0.01ms | +0.00ms | +14.23% |
| max | 0.82ms | 0.63ms | +0.18ms | +28.55% |
| total | 7.55ms | 6.52ms | +1.03ms | +15.84% |

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
| max | 0.11ms |
| total | 1.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +1.09% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -6.23% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -6.40% |
| mean | 0.01ms | 0.01ms | +0.00ms | +0.44% |
| min | 0.01ms | 0.01ms | +0.00ms | +1.15% |
| max | 0.11ms | 0.09ms | +0.02ms | +17.24% |
| total | 1.67ms | 1.66ms | +0.01ms | +0.44% |

### typesenseSearchQuery

# Perf Report — typesenseSearchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.11ms |
| mean | 0.01ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.45ms |
| total | 2.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +0.87% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +26.96% |
| p99 | 0.11ms | 0.04ms | +0.07ms | +179.51% |
| mean | 0.01ms | 0.01ms | +0.00ms | +30.11% |
| min | 0.01ms | 0.01ms | 0.00ms | 0.00% |
| max | 0.45ms | 0.12ms | +0.33ms | +273.92% |
| total | 2.32ms | 1.78ms | +0.54ms | +30.11% |

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -17.17% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +2.93% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.27% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +1.00% |
| total | 0.11ms | 0.10ms | +0.01ms | +5.27% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +7.56% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +24.94% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.61% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +5.77% |
| total | 0.09ms | 0.09ms | +0.00ms | +3.61% |

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
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +18.23% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +26.19% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.35% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.00ms | +0.00ms | +180.02% |
| total | 0.10ms | 0.09ms | +0.01ms | +10.35% |

