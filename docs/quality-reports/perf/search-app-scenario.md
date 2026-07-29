# Perf Suite — search-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 0.26ms | 0.51ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| search_heavy_workload (50 docs + 50 search) | 0.62ms | 0.72ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| filter_search_cycle (20 docs + 20 filtered search) | 0.18ms | 0.31ms | 80ms | 0.00049ms | PASS | stable (p10 +71% (閾値未満)、 p95 +54% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 1.22ms | 200ms | PASS |
| search_heavy_workload (50 docs + 50 search) | 2.76ms | 200ms | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | 0.48ms | 160ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | -5360 B | 0 B | 102400 B | yes | PASS |
| search_heavy_workload (50 docs + 50 search) | -6912 B | 0 B | 102400 B | yes | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | -17112 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### index_build (100 docs addDocuments + 10 search)

# Perf Report — index_build (100 docs addDocuments + 10 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.26ms |
| p50 | 0.34ms |
| p95 | 0.51ms |
| p99 | 0.63ms |
| mean | 0.36ms |
| stdev | 0.10ms |
| min | 0.26ms |
| max | 0.66ms |
| total | 7.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.26ms | 0.25ms | +0.0091ms | +3.62% |
| p50 | 0.34ms | 0.31ms | +0.03ms | +10.46% |
| p95 | 0.51ms | 0.53ms | -0.01ms | -2.56% |
| p99 | 0.63ms | 0.63ms | +0.0056ms | +0.88% |
| mean | 0.36ms | 0.35ms | +0.0033ms | +0.94% |
| min | 0.26ms | 0.25ms | +0.0044ms | +1.75% |
| max | 0.66ms | 0.65ms | +0.01ms | +1.58% |
| total | 7.14ms | 7.07ms | +0.07ms | +0.94% |

### search_heavy_workload (50 docs + 50 search)

# Perf Report — search_heavy_workload (50 docs + 50 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.62ms |
| p50 | 0.66ms |
| p95 | 0.72ms |
| p99 | 0.73ms |
| mean | 0.66ms |
| stdev | 0.03ms |
| min | 0.62ms |
| max | 0.73ms |
| total | 13.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.62ms | 0.61ms | +0.0098ms | +1.60% |
| p50 | 0.66ms | 0.65ms | +0.0028ms | +0.43% |
| p95 | 0.72ms | 0.77ms | -0.05ms | -6.64% |
| p99 | 0.73ms | 1.21ms | -0.47ms | -39.26% |
| mean | 0.66ms | 0.68ms | -0.02ms | -3.17% |
| min | 0.62ms | 0.61ms | +0.0073ms | +1.20% |
| max | 0.73ms | 1.31ms | -0.58ms | -44.06% |
| total | 13.20ms | 13.63ms | -0.43ms | -3.17% |

### filter_search_cycle (20 docs + 20 filtered search)

# Perf Report — filter_search_cycle (20 docs + 20 filtered search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.18ms |
| p50 | 0.19ms |
| p95 | 0.31ms |
| p99 | 0.69ms |
| mean | 0.22ms |
| stdev | 0.14ms |
| min | 0.11ms |
| max | 0.79ms |
| total | 4.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.18ms | 0.10ms | +0.07ms | +70.91% |
| p50 | 0.19ms | 0.18ms | +0.0089ms | +5.05% |
| p95 | 0.31ms | 0.20ms | +0.11ms | +53.81% |
| p99 | 0.69ms | 0.29ms | +0.41ms | +142.06% |
| mean | 0.22ms | 0.16ms | +0.06ms | +35.89% |
| min | 0.11ms | 0.10ms | +0.0040ms | +3.98% |
| max | 0.79ms | 0.31ms | +0.48ms | +156.72% |
| total | 4.39ms | 3.23ms | +1.16ms | +35.89% |

