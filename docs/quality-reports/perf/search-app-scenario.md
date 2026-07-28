# Perf Suite — search-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 0.52ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +116%) 以上の悪化が必要) |
| search_heavy_workload (50 docs + 50 search) | 0.85ms | 100ms | PASS | stable (差 0.29ms が下限 0.5ms 未満で判定を保留) |
| filter_search_cycle (20 docs + 20 filtered search) | 0.14ms | 80ms | PASS | stable (差 0.28ms が下限 0.5ms 未満で判定を保留) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 1.14ms | 200ms | PASS |
| search_heavy_workload (50 docs + 50 search) | 2.83ms | 200ms | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | 0.48ms | 160ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | -11752 B | 0 B | 102400 B | yes | PASS |
| search_heavy_workload (50 docs + 50 search) | -18872 B | 0 B | 102400 B | yes | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | 5176 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### index_build (100 docs addDocuments + 10 search)

# Perf Report — index_build (100 docs addDocuments + 10 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.34ms |
| p95 | 0.52ms |
| p99 | 0.61ms |
| mean | 0.36ms |
| stdev | 0.10ms |
| min | 0.26ms |
| max | 0.63ms |
| total | 7.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.34ms | 0.28ms | +0.06ms | +20.81% |
| p95 | 0.52ms | 0.43ms | +0.09ms | +21.14% |
| p99 | 0.61ms | 0.64ms | -0.03ms | -4.72% |
| mean | 0.36ms | 0.32ms | +0.04ms | +12.08% |
| min | 0.26ms | 0.27ms | -0.01ms | -4.44% |
| max | 0.63ms | 1.80ms | -1.17ms | -65.02% |
| total | 7.11ms | 63.42ms | -56.31ms | -88.79% |

### search_heavy_workload (50 docs + 50 search)

# Perf Report — search_heavy_workload (50 docs + 50 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.69ms |
| p95 | 0.85ms |
| p99 | 0.89ms |
| mean | 0.73ms |
| stdev | 0.09ms |
| min | 0.62ms |
| max | 0.90ms |
| total | 14.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.69ms | 0.72ms | -0.03ms | -3.98% |
| p95 | 0.85ms | 1.14ms | -0.29ms | -25.44% |
| p99 | 0.89ms | 1.35ms | -0.46ms | -33.84% |
| mean | 0.73ms | 0.77ms | -0.05ms | -6.08% |
| min | 0.62ms | 0.64ms | -0.02ms | -2.67% |
| max | 0.90ms | 2.85ms | -1.95ms | -68.40% |
| total | 14.53ms | 154.71ms | -140.18ms | -90.61% |

### filter_search_cycle (20 docs + 20 filtered search)

# Perf Report — filter_search_cycle (20 docs + 20 filtered search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.10ms |
| p95 | 0.14ms |
| p99 | 0.17ms |
| mean | 0.10ms |
| stdev | 0.02ms |
| min | 0.09ms |
| max | 0.18ms |
| total | 2.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.10ms | 0.12ms | -0.01ms | -12.04% |
| p95 | 0.14ms | 0.41ms | -0.28ms | -67.04% |
| p99 | 0.17ms | 0.73ms | -0.56ms | -76.59% |
| mean | 0.10ms | 0.18ms | -0.08ms | -41.89% |
| min | 0.09ms | 0.08ms | +0.00ms | +4.69% |
| max | 0.18ms | 0.93ms | -0.75ms | -80.69% |
| total | 2.09ms | 35.94ms | -33.85ms | -94.19% |

