# Perf Suite — search-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 0.27ms | 1.18ms | 100ms | 0.00049ms | PASS | stable (p10 +9% (閾値未満)、 p95 +124% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| search_heavy_workload (50 docs + 50 search) | 0.65ms | 1.01ms | 100ms | 0.00049ms | PASS | stable (p10 +7% (閾値未満)、 p95 +31% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| filter_search_cycle (20 docs + 20 filtered search) | 0.09ms | 0.23ms | 80ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 1.38ms | 200ms | PASS |
| search_heavy_workload (50 docs + 50 search) | 3.10ms | 200ms | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | 0.46ms | 160ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | -6608 B | 0 B | 102400 B | yes | PASS |
| search_heavy_workload (50 docs + 50 search) | -19336 B | 0 B | 102400 B | yes | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | -8184 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### index_build (100 docs addDocuments + 10 search)

# Perf Report — index_build (100 docs addDocuments + 10 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.27ms |
| p50 | 0.44ms |
| p95 | 1.18ms |
| p99 | 1.23ms |
| mean | 0.52ms |
| stdev | 0.31ms |
| min | 0.26ms |
| max | 1.24ms |
| total | 10.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.27ms | 0.25ms | +0.02ms | +8.74% |
| p50 | 0.44ms | 0.31ms | +0.13ms | +41.18% |
| p95 | 1.18ms | 0.53ms | +0.65ms | +123.63% |
| p99 | 1.23ms | 0.63ms | +0.60ms | +95.46% |
| mean | 0.52ms | 0.35ms | +0.16ms | +46.29% |
| min | 0.26ms | 0.25ms | +0.010ms | +3.95% |
| max | 1.24ms | 0.65ms | +0.59ms | +89.77% |
| total | 10.35ms | 7.07ms | +3.28ms | +46.29% |

### search_heavy_workload (50 docs + 50 search)

# Perf Report — search_heavy_workload (50 docs + 50 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.65ms |
| p50 | 0.72ms |
| p95 | 1.01ms |
| p99 | 1.02ms |
| mean | 0.79ms |
| stdev | 0.14ms |
| min | 0.65ms |
| max | 1.02ms |
| total | 15.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.65ms | 0.61ms | +0.04ms | +6.72% |
| p50 | 0.72ms | 0.65ms | +0.07ms | +10.46% |
| p95 | 1.01ms | 0.77ms | +0.24ms | +30.60% |
| p99 | 1.02ms | 1.21ms | -0.19ms | -15.68% |
| mean | 0.79ms | 0.68ms | +0.11ms | +15.89% |
| min | 0.65ms | 0.61ms | +0.04ms | +6.52% |
| max | 1.02ms | 1.31ms | -0.30ms | -22.49% |
| total | 15.80ms | 13.63ms | +2.17ms | +15.89% |

### filter_search_cycle (20 docs + 20 filtered search)

# Perf Report — filter_search_cycle (20 docs + 20 filtered search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.09ms |
| p50 | 0.11ms |
| p95 | 0.23ms |
| p99 | 0.39ms |
| mean | 0.14ms |
| stdev | 0.08ms |
| min | 0.09ms |
| max | 0.43ms |
| total | 2.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.10ms | -0.01ms | -11.87% |
| p50 | 0.11ms | 0.18ms | -0.07ms | -38.62% |
| p95 | 0.23ms | 0.20ms | +0.03ms | +12.64% |
| p99 | 0.39ms | 0.29ms | +0.11ms | +37.58% |
| mean | 0.14ms | 0.16ms | -0.02ms | -13.97% |
| min | 0.09ms | 0.10ms | -0.01ms | -11.17% |
| max | 0.43ms | 0.31ms | +0.13ms | +41.72% |
| total | 2.78ms | 3.23ms | -0.45ms | -13.97% |

