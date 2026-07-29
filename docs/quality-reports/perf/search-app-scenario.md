# Perf Suite — search-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 0.27ms | 0.50ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| search_heavy_workload (50 docs + 50 search) | 0.64ms | 0.87ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| filter_search_cycle (20 docs + 20 filtered search) | 0.09ms | 0.18ms | 80ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 2.95ms | 200ms | PASS |
| search_heavy_workload (50 docs + 50 search) | 2.85ms | 200ms | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | 0.45ms | 160ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | -6608 B | 0 B | 102400 B | yes | PASS |
| search_heavy_workload (50 docs + 50 search) | -17976 B | 0 B | 102400 B | yes | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | -7096 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### index_build (100 docs addDocuments + 10 search)

# Perf Report — index_build (100 docs addDocuments + 10 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.27ms |
| p50 | 0.33ms |
| p95 | 0.50ms |
| p99 | 0.62ms |
| mean | 0.35ms |
| stdev | 0.10ms |
| min | 0.26ms |
| max | 0.65ms |
| total | 7.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.27ms | 0.25ms | +0.02ms | +6.92% |
| p50 | 0.33ms | 0.31ms | +0.02ms | +6.55% |
| p95 | 0.50ms | 0.53ms | -0.02ms | -4.67% |
| p99 | 0.62ms | 0.63ms | -0.0084ms | -1.33% |
| mean | 0.35ms | 0.35ms | -0.00042ms | -0.12% |
| min | 0.26ms | 0.25ms | +0.01ms | +4.00% |
| max | 0.65ms | 0.65ms | -0.0043ms | -0.66% |
| total | 7.07ms | 7.07ms | -0.0083ms | -0.12% |

### search_heavy_workload (50 docs + 50 search)

# Perf Report — search_heavy_workload (50 docs + 50 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.64ms |
| p50 | 0.71ms |
| p95 | 0.87ms |
| p99 | 0.92ms |
| mean | 0.73ms |
| stdev | 0.09ms |
| min | 0.62ms |
| max | 0.93ms |
| total | 14.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.64ms | 0.61ms | +0.03ms | +5.43% |
| p50 | 0.71ms | 0.65ms | +0.06ms | +8.50% |
| p95 | 0.87ms | 0.77ms | +0.10ms | +13.21% |
| p99 | 0.92ms | 1.21ms | -0.28ms | -23.60% |
| mean | 0.73ms | 0.68ms | +0.05ms | +7.72% |
| min | 0.62ms | 0.61ms | +0.01ms | +2.46% |
| max | 0.93ms | 1.31ms | -0.38ms | -29.02% |
| total | 14.69ms | 13.63ms | +1.05ms | +7.72% |

### filter_search_cycle (20 docs + 20 filtered search)

# Perf Report — filter_search_cycle (20 docs + 20 filtered search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.09ms |
| p50 | 0.10ms |
| p95 | 0.18ms |
| p99 | 0.22ms |
| mean | 0.11ms |
| stdev | 0.04ms |
| min | 0.09ms |
| max | 0.23ms |
| total | 2.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.10ms | -0.01ms | -12.26% |
| p50 | 0.10ms | 0.18ms | -0.07ms | -41.65% |
| p95 | 0.18ms | 0.20ms | -0.02ms | -11.40% |
| p99 | 0.22ms | 0.29ms | -0.06ms | -22.09% |
| mean | 0.11ms | 0.16ms | -0.05ms | -29.50% |
| min | 0.09ms | 0.10ms | -0.01ms | -12.24% |
| max | 0.23ms | 0.31ms | -0.07ms | -23.86% |
| total | 2.28ms | 3.23ms | -0.95ms | -29.50% |

