# Perf Suite — search-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 0.54ms | 100ms | PASS | stable |
| search_heavy_workload (50 docs + 50 search) | 1.25ms | 100ms | PASS | regressed |
| filter_search_cycle (20 docs + 20 filtered search) | 0.13ms | 80ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 1.25ms | 200ms | PASS |
| search_heavy_workload (50 docs + 50 search) | 2.74ms | 200ms | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | 0.50ms | 160ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 120416 B | 0 B | 102400 B | PASS |
| search_heavy_workload (50 docs + 50 search) | -754264 B | 0 B | 102400 B | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | -6158688 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### index_build (100 docs addDocuments + 10 search)

# Perf Report — index_build (100 docs addDocuments + 10 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.35ms |
| p95 | 0.54ms |
| p99 | 0.65ms |
| mean | 0.36ms |
| stdev | 0.11ms |
| min | 0.28ms |
| max | 0.68ms |
| total | 7.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.35ms | 0.35ms | -0.00ms | -1.35% |
| p95 | 0.54ms | 0.50ms | +0.03ms | +6.52% |
| p99 | 0.65ms | 0.60ms | +0.05ms | +8.45% |
| mean | 0.36ms | 0.36ms | +0.00ms | +1.22% |
| min | 0.28ms | 0.26ms | +0.02ms | +6.91% |
| max | 0.68ms | 0.62ms | +0.06ms | +8.84% |
| total | 7.25ms | 7.16ms | +0.09ms | +1.22% |

### search_heavy_workload (50 docs + 50 search)

# Perf Report — search_heavy_workload (50 docs + 50 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.89ms |
| p95 | 1.25ms |
| p99 | 1.38ms |
| mean | 0.96ms |
| stdev | 0.17ms |
| min | 0.83ms |
| max | 1.41ms |
| total | 19.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.89ms | 0.66ms | +0.23ms | +35.19% |
| p95 | 1.25ms | 0.82ms | +0.44ms | +53.79% |
| p99 | 1.38ms | 0.94ms | +0.44ms | +46.74% |
| mean | 0.96ms | 0.68ms | +0.28ms | +41.62% |
| min | 0.83ms | 0.62ms | +0.21ms | +32.82% |
| max | 1.41ms | 0.97ms | +0.44ms | +45.26% |
| total | 19.17ms | 13.53ms | +5.63ms | +41.62% |

### filter_search_cycle (20 docs + 20 filtered search)

# Perf Report — filter_search_cycle (20 docs + 20 filtered search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.09ms |
| p95 | 0.13ms |
| p99 | 0.19ms |
| mean | 0.10ms |
| stdev | 0.03ms |
| min | 0.09ms |
| max | 0.20ms |
| total | 2.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.09ms | 0.10ms | -0.01ms | -9.52% |
| p95 | 0.13ms | 0.18ms | -0.04ms | -24.87% |
| p99 | 0.19ms | 0.19ms | +0.00ms | +0.22% |
| mean | 0.10ms | 0.11ms | -0.01ms | -8.18% |
| min | 0.09ms | 0.09ms | -0.00ms | -4.47% |
| max | 0.20ms | 0.19ms | +0.01ms | +6.17% |
| total | 2.04ms | 2.23ms | -0.18ms | -8.18% |

