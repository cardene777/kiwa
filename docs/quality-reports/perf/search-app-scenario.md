# Perf Suite — search-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 1.81ms | 100ms | PASS | regressed — gate 無効 (regressionGate=false) |
| search_heavy_workload (50 docs + 50 search) | 0.97ms | 100ms | PASS | stable — gate 無効 (regressionGate=false) |
| filter_search_cycle (20 docs + 20 filtered search) | 0.77ms | 80ms | PASS | stable (検知には +0.5ms (baseline 比 +121%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 1.19ms | 200ms | PASS |
| search_heavy_workload (50 docs + 50 search) | 3.81ms | 200ms | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | 0.47ms | 160ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | -11800 B | 0 B | 102400 B | yes | PASS |
| search_heavy_workload (50 docs + 50 search) | -33968 B | 0 B | 102400 B | yes | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | -7048 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### index_build (100 docs addDocuments + 10 search)

# Perf Report — index_build (100 docs addDocuments + 10 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.44ms |
| p95 | 1.81ms |
| p99 | 5.29ms |
| mean | 0.82ms |
| stdev | 1.30ms |
| min | 0.28ms |
| max | 6.16ms |
| total | 16.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.44ms | 0.28ms | +0.16ms | +57.11% |
| p95 | 1.81ms | 0.43ms | +1.38ms | +320.05% |
| p99 | 5.29ms | 0.64ms | +4.65ms | +729.06% |
| mean | 0.82ms | 0.32ms | +0.50ms | +158.94% |
| min | 0.28ms | 0.27ms | +0.01ms | +4.03% |
| max | 6.16ms | 1.80ms | +4.36ms | +242.40% |
| total | 16.42ms | 63.42ms | -47.00ms | -74.11% |

### search_heavy_workload (50 docs + 50 search)

# Perf Report — search_heavy_workload (50 docs + 50 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.83ms |
| p95 | 0.97ms |
| p99 | 1.03ms |
| mean | 0.83ms |
| stdev | 0.11ms |
| min | 0.69ms |
| max | 1.05ms |
| total | 16.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.83ms | 0.72ms | +0.11ms | +15.30% |
| p95 | 0.97ms | 1.14ms | -0.17ms | -14.86% |
| p99 | 1.03ms | 1.35ms | -0.31ms | -23.25% |
| mean | 0.83ms | 0.77ms | +0.05ms | +7.10% |
| min | 0.69ms | 0.64ms | +0.05ms | +8.50% |
| max | 1.05ms | 2.85ms | -1.80ms | -63.20% |
| total | 16.57ms | 154.71ms | -138.14ms | -89.29% |

### filter_search_cycle (20 docs + 20 filtered search)

# Perf Report — filter_search_cycle (20 docs + 20 filtered search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.12ms |
| p95 | 0.77ms |
| p99 | 1.06ms |
| mean | 0.24ms |
| stdev | 0.27ms |
| min | 0.10ms |
| max | 1.13ms |
| total | 4.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.12ms | 0.12ms | +0.00ms | +3.27% |
| p95 | 0.77ms | 0.41ms | +0.36ms | +86.54% |
| p99 | 1.06ms | 0.73ms | +0.33ms | +45.87% |
| mean | 0.24ms | 0.18ms | +0.06ms | +32.95% |
| min | 0.10ms | 0.08ms | +0.02ms | +22.54% |
| max | 1.13ms | 0.93ms | +0.21ms | +22.45% |
| total | 4.78ms | 35.94ms | -31.16ms | -86.71% |

