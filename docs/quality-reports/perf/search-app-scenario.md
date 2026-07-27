# Perf Suite — search-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 0.57ms | 100ms | PASS | stable |
| search_heavy_workload (50 docs + 50 search) | 0.84ms | 100ms | PASS | improved |
| filter_search_cycle (20 docs + 20 filtered search) | 0.21ms | 80ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 1.11ms | 200ms | PASS |
| search_heavy_workload (50 docs + 50 search) | 2.93ms | 200ms | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | 0.44ms | 160ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | -11200 B | 0 B | 102400 B | yes | PASS |
| search_heavy_workload (50 docs + 50 search) | -19920 B | 0 B | 102400 B | yes | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | -1952 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### index_build (100 docs addDocuments + 10 search)

# Perf Report — index_build (100 docs addDocuments + 10 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.35ms |
| p95 | 0.57ms |
| p99 | 0.68ms |
| mean | 0.36ms |
| stdev | 0.12ms |
| min | 0.26ms |
| max | 0.71ms |
| total | 7.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.35ms | 0.32ms | +0.02ms | +7.52% |
| p95 | 0.57ms | 0.50ms | +0.07ms | +13.09% |
| p99 | 0.68ms | 0.61ms | +0.07ms | +11.31% |
| mean | 0.36ms | 0.35ms | +0.01ms | +2.12% |
| min | 0.26ms | 0.25ms | +0.00ms | +1.39% |
| max | 0.71ms | 0.64ms | +0.07ms | +10.96% |
| total | 7.19ms | 7.04ms | +0.15ms | +2.12% |

### search_heavy_workload (50 docs + 50 search)

# Perf Report — search_heavy_workload (50 docs + 50 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.71ms |
| p95 | 0.84ms |
| p99 | 0.86ms |
| mean | 0.73ms |
| stdev | 0.08ms |
| min | 0.62ms |
| max | 0.87ms |
| total | 14.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.71ms | 0.80ms | -0.09ms | -11.73% |
| p95 | 0.84ms | 1.45ms | -0.62ms | -42.48% |
| p99 | 0.86ms | 1.45ms | -0.59ms | -40.82% |
| mean | 0.73ms | 0.96ms | -0.23ms | -23.69% |
| min | 0.62ms | 0.69ms | -0.07ms | -9.68% |
| max | 0.87ms | 1.46ms | -0.59ms | -40.41% |
| total | 14.61ms | 19.14ms | -4.53ms | -23.69% |

### filter_search_cycle (20 docs + 20 filtered search)

# Perf Report — filter_search_cycle (20 docs + 20 filtered search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.18ms |
| p95 | 0.21ms |
| p99 | 0.26ms |
| mean | 0.16ms |
| stdev | 0.05ms |
| min | 0.10ms |
| max | 0.27ms |
| total | 3.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.18ms | 0.10ms | +0.07ms | +69.85% |
| p95 | 0.21ms | 0.14ms | +0.07ms | +47.34% |
| p99 | 0.26ms | 0.19ms | +0.07ms | +39.06% |
| mean | 0.16ms | 0.11ms | +0.05ms | +44.35% |
| min | 0.10ms | 0.09ms | +0.01ms | +13.30% |
| max | 0.27ms | 0.20ms | +0.07ms | +37.55% |
| total | 3.12ms | 2.16ms | +0.96ms | +44.35% |

