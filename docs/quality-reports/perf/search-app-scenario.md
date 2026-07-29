# Perf Suite — search-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 0.27ms | 0.77ms | 100ms | 0.00042ms | PASS | stable (p10 +7% (閾値未満)、 p95 +47% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| search_heavy_workload (50 docs + 50 search) | 0.70ms | 0.98ms | 100ms | 0.00042ms | PASS | stable (p10 +14% (閾値未満)、 p95 +27% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| filter_search_cycle (20 docs + 20 filtered search) | 0.10ms | 0.18ms | 80ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 1.22ms | 200ms | PASS |
| search_heavy_workload (50 docs + 50 search) | 3.60ms | 200ms | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | 0.49ms | 160ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | -6600 B | 0 B | 102400 B | yes | PASS |
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
| p50 | 0.40ms |
| p95 | 0.77ms |
| p99 | 0.83ms |
| mean | 0.43ms |
| stdev | 0.16ms |
| min | 0.27ms |
| max | 0.84ms |
| total | 8.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.27ms | 0.25ms | +0.02ms | +7.02% |
| p50 | 0.40ms | 0.31ms | +0.09ms | +28.34% |
| p95 | 0.77ms | 0.53ms | +0.25ms | +46.53% |
| p99 | 0.83ms | 0.63ms | +0.20ms | +31.30% |
| mean | 0.43ms | 0.35ms | +0.08ms | +21.51% |
| min | 0.27ms | 0.25ms | +0.01ms | +5.58% |
| max | 0.84ms | 0.65ms | +0.18ms | +28.22% |
| total | 8.60ms | 7.07ms | +1.52ms | +21.51% |

### search_heavy_workload (50 docs + 50 search)

# Perf Report — search_heavy_workload (50 docs + 50 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.70ms |
| p50 | 0.80ms |
| p95 | 0.98ms |
| p99 | 0.99ms |
| mean | 0.81ms |
| stdev | 0.10ms |
| min | 0.65ms |
| max | 0.99ms |
| total | 16.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.70ms | 0.61ms | +0.09ms | +14.22% |
| p50 | 0.80ms | 0.65ms | +0.15ms | +22.22% |
| p95 | 0.98ms | 0.77ms | +0.21ms | +26.58% |
| p99 | 0.99ms | 1.21ms | -0.22ms | -18.01% |
| mean | 0.81ms | 0.68ms | +0.13ms | +18.42% |
| min | 0.65ms | 0.61ms | +0.04ms | +6.70% |
| max | 0.99ms | 1.31ms | -0.32ms | -24.57% |
| total | 16.15ms | 13.63ms | +2.51ms | +18.42% |

### filter_search_cycle (20 docs + 20 filtered search)

# Perf Report — filter_search_cycle (20 docs + 20 filtered search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.10ms |
| p50 | 0.11ms |
| p95 | 0.18ms |
| p99 | 0.20ms |
| mean | 0.11ms |
| stdev | 0.03ms |
| min | 0.10ms |
| max | 0.21ms |
| total | 2.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.10ms | -0.0061ms | -5.93% |
| p50 | 0.11ms | 0.18ms | -0.07ms | -37.39% |
| p95 | 0.18ms | 0.20ms | -0.03ms | -13.24% |
| p99 | 0.20ms | 0.29ms | -0.08ms | -29.63% |
| mean | 0.11ms | 0.16ms | -0.05ms | -28.86% |
| min | 0.10ms | 0.10ms | -0.0062ms | -6.16% |
| max | 0.21ms | 0.31ms | -0.10ms | -32.35% |
| total | 2.30ms | 3.23ms | -0.93ms | -28.86% |

