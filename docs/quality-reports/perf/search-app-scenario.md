# Perf Suite — search-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 0.56ms | 100ms | PASS | stable |
| search_heavy_workload (50 docs + 50 search) | 0.88ms | 100ms | PASS | improved |
| filter_search_cycle (20 docs + 20 filtered search) | 0.31ms | 80ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 1.62ms | 200ms | PASS |
| search_heavy_workload (50 docs + 50 search) | 3.05ms | 200ms | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | 0.41ms | 160ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | -11296 B | 0 B | 102400 B | yes | PASS |
| search_heavy_workload (50 docs + 50 search) | -18960 B | 0 B | 102400 B | yes | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | -1856 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### index_build (100 docs addDocuments + 10 search)

# Perf Report — index_build (100 docs addDocuments + 10 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.34ms |
| p95 | 0.56ms |
| p99 | 0.70ms |
| mean | 0.36ms |
| stdev | 0.13ms |
| min | 0.25ms |
| max | 0.74ms |
| total | 7.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.34ms | 0.32ms | +0.02ms | +4.66% |
| p95 | 0.56ms | 0.50ms | +0.06ms | +11.79% |
| p99 | 0.70ms | 0.61ms | +0.09ms | +14.99% |
| mean | 0.36ms | 0.35ms | +0.01ms | +2.37% |
| min | 0.25ms | 0.25ms | -0.00ms | -1.87% |
| max | 0.74ms | 0.64ms | +0.10ms | +15.62% |
| total | 7.20ms | 7.04ms | +0.17ms | +2.37% |

### search_heavy_workload (50 docs + 50 search)

# Perf Report — search_heavy_workload (50 docs + 50 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.76ms |
| p95 | 0.88ms |
| p99 | 0.90ms |
| mean | 0.78ms |
| stdev | 0.07ms |
| min | 0.68ms |
| max | 0.90ms |
| total | 15.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.76ms | 0.80ms | -0.04ms | -5.59% |
| p95 | 0.88ms | 1.45ms | -0.58ms | -39.65% |
| p99 | 0.90ms | 1.45ms | -0.56ms | -38.38% |
| mean | 0.78ms | 0.96ms | -0.18ms | -18.96% |
| min | 0.68ms | 0.69ms | -0.01ms | -1.25% |
| max | 0.90ms | 1.46ms | -0.55ms | -38.06% |
| total | 15.51ms | 19.14ms | -3.63ms | -18.96% |

### filter_search_cycle (20 docs + 20 filtered search)

# Perf Report — filter_search_cycle (20 docs + 20 filtered search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.18ms |
| p95 | 0.31ms |
| p99 | 0.37ms |
| mean | 0.17ms |
| stdev | 0.07ms |
| min | 0.10ms |
| max | 0.39ms |
| total | 3.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.18ms | 0.10ms | +0.08ms | +73.42% |
| p95 | 0.31ms | 0.14ms | +0.17ms | +116.61% |
| p99 | 0.37ms | 0.19ms | +0.19ms | +101.28% |
| mean | 0.17ms | 0.11ms | +0.07ms | +61.24% |
| min | 0.10ms | 0.09ms | +0.01ms | +16.15% |
| max | 0.39ms | 0.20ms | +0.19ms | +98.47% |
| total | 3.49ms | 2.16ms | +1.32ms | +61.24% |

