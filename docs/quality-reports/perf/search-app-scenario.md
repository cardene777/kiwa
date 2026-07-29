# Perf Suite — search-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 0.29ms | 1.20ms | 100ms | 0.00042ms | PASS | stable (p10 +16% (閾値未満)、 p95 +126% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| search_heavy_workload (50 docs + 50 search) | 0.69ms | 1.00ms | 100ms | 0.00042ms | PASS | stable (p10 +13% (閾値未満)、 p95 +29% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| filter_search_cycle (20 docs + 20 filtered search) | 0.09ms | 0.17ms | 80ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 1.31ms | 200ms | PASS |
| search_heavy_workload (50 docs + 50 search) | 7.20ms | 200ms | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | 0.47ms | 160ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | -5728 B | 0 B | 102400 B | yes | PASS |
| search_heavy_workload (50 docs + 50 search) | -17976 B | 0 B | 102400 B | yes | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | -7096 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### index_build (100 docs addDocuments + 10 search)

# Perf Report — index_build (100 docs addDocuments + 10 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.29ms |
| p50 | 0.51ms |
| p95 | 1.20ms |
| p99 | 1.37ms |
| mean | 0.57ms |
| stdev | 0.32ms |
| min | 0.28ms |
| max | 1.42ms |
| total | 11.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.29ms | 0.25ms | +0.04ms | +16.35% |
| p50 | 0.51ms | 0.31ms | +0.20ms | +63.81% |
| p95 | 1.20ms | 0.53ms | +0.67ms | +126.27% |
| p99 | 1.37ms | 0.63ms | +0.74ms | +118.48% |
| mean | 0.57ms | 0.35ms | +0.22ms | +62.39% |
| min | 0.28ms | 0.25ms | +0.03ms | +12.29% |
| max | 1.42ms | 0.65ms | +0.76ms | +116.90% |
| total | 11.49ms | 7.07ms | +4.41ms | +62.39% |

### search_heavy_workload (50 docs + 50 search)

# Perf Report — search_heavy_workload (50 docs + 50 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.69ms |
| p50 | 0.86ms |
| p95 | 1.00ms |
| p99 | 1.03ms |
| mean | 0.85ms |
| stdev | 0.13ms |
| min | 0.68ms |
| max | 1.03ms |
| total | 16.96ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.69ms | 0.61ms | +0.08ms | +12.82% |
| p50 | 0.86ms | 0.65ms | +0.20ms | +31.12% |
| p95 | 1.00ms | 0.77ms | +0.23ms | +29.30% |
| p99 | 1.03ms | 1.21ms | -0.18ms | -14.81% |
| mean | 0.85ms | 0.68ms | +0.17ms | +24.43% |
| min | 0.68ms | 0.61ms | +0.08ms | +12.47% |
| max | 1.03ms | 1.31ms | -0.28ms | -21.30% |
| total | 16.96ms | 13.63ms | +3.33ms | +24.43% |

### filter_search_cycle (20 docs + 20 filtered search)

# Perf Report — filter_search_cycle (20 docs + 20 filtered search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.09ms |
| p50 | 0.10ms |
| p95 | 0.17ms |
| p99 | 0.23ms |
| mean | 0.11ms |
| stdev | 0.04ms |
| min | 0.09ms |
| max | 0.25ms |
| total | 2.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.10ms | -0.01ms | -13.52% |
| p50 | 0.10ms | 0.18ms | -0.08ms | -42.64% |
| p95 | 0.17ms | 0.20ms | -0.04ms | -17.61% |
| p99 | 0.23ms | 0.29ms | -0.05ms | -18.45% |
| mean | 0.11ms | 0.16ms | -0.05ms | -31.14% |
| min | 0.09ms | 0.10ms | -0.01ms | -12.53% |
| max | 0.25ms | 0.31ms | -0.06ms | -18.59% |
| total | 2.23ms | 3.23ms | -1.01ms | -31.14% |

