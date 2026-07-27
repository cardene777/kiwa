# Perf Suite — search-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 0.50ms | 100ms | PASS | stable |
| search_heavy_workload (50 docs + 50 search) | 0.81ms | 100ms | PASS | improved |
| filter_search_cycle (20 docs + 20 filtered search) | 0.15ms | 80ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 1.15ms | 200ms | PASS |
| search_heavy_workload (50 docs + 50 search) | 2.75ms | 200ms | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | 0.44ms | 160ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | -11376 B | 0 B | 102400 B | yes | PASS |
| search_heavy_workload (50 docs + 50 search) | -17656 B | 0 B | 102400 B | yes | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | -14192 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### index_build (100 docs addDocuments + 10 search)

# Perf Report — index_build (100 docs addDocuments + 10 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.32ms |
| p95 | 0.50ms |
| p99 | 0.63ms |
| mean | 0.34ms |
| stdev | 0.11ms |
| min | 0.25ms |
| max | 0.67ms |
| total | 6.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.32ms | 0.32ms | -0.01ms | -2.21% |
| p95 | 0.50ms | 0.50ms | -0.00ms | -0.93% |
| p99 | 0.63ms | 0.61ms | +0.02ms | +3.77% |
| mean | 0.34ms | 0.35ms | -0.01ms | -2.11% |
| min | 0.25ms | 0.25ms | -0.01ms | -2.51% |
| max | 0.67ms | 0.64ms | +0.03ms | +4.70% |
| total | 6.89ms | 7.04ms | -0.15ms | -2.11% |

### search_heavy_workload (50 docs + 50 search)

# Perf Report — search_heavy_workload (50 docs + 50 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.68ms |
| p95 | 0.81ms |
| p99 | 0.83ms |
| mean | 0.72ms |
| stdev | 0.08ms |
| min | 0.62ms |
| max | 0.84ms |
| total | 14.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.68ms | 0.80ms | -0.12ms | -15.08% |
| p95 | 0.81ms | 1.45ms | -0.64ms | -44.32% |
| p99 | 0.83ms | 1.45ms | -0.62ms | -42.85% |
| mean | 0.72ms | 0.96ms | -0.24ms | -25.29% |
| min | 0.62ms | 0.69ms | -0.07ms | -10.00% |
| max | 0.84ms | 1.46ms | -0.62ms | -42.49% |
| total | 14.30ms | 19.14ms | -4.84ms | -25.29% |

### filter_search_cycle (20 docs + 20 filtered search)

# Perf Report — filter_search_cycle (20 docs + 20 filtered search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.10ms |
| p95 | 0.15ms |
| p99 | 0.18ms |
| mean | 0.11ms |
| stdev | 0.02ms |
| min | 0.09ms |
| max | 0.18ms |
| total | 2.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.10ms | 0.10ms | -0.00ms | -2.08% |
| p95 | 0.15ms | 0.14ms | +0.01ms | +4.68% |
| p99 | 0.18ms | 0.19ms | -0.01ms | -4.20% |
| mean | 0.11ms | 0.11ms | -0.00ms | -2.23% |
| min | 0.09ms | 0.09ms | -0.00ms | -0.61% |
| max | 0.18ms | 0.20ms | -0.01ms | -5.82% |
| total | 2.11ms | 2.16ms | -0.05ms | -2.23% |

