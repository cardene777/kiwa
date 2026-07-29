# Perf Suite — search-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 0.27ms | 0.57ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| search_heavy_workload (50 docs + 50 search) | 0.67ms | 0.90ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| filter_search_cycle (20 docs + 20 filtered search) | 0.11ms | 0.35ms | 80ms | 0.00050ms | PASS | stable (p10 +3% (閾値未満)、 p95 +73% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 1.21ms | 200ms | PASS |
| search_heavy_workload (50 docs + 50 search) | 3.26ms | 200ms | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | 0.53ms | 160ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | -6584 B | 0 B | 102400 B | yes | PASS |
| search_heavy_workload (50 docs + 50 search) | -5096 B | 0 B | 102400 B | yes | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | -424 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### index_build (100 docs addDocuments + 10 search)

# Perf Report — index_build (100 docs addDocuments + 10 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.27ms |
| p50 | 0.34ms |
| p95 | 0.57ms |
| p99 | 0.71ms |
| mean | 0.38ms |
| stdev | 0.13ms |
| min | 0.27ms |
| max | 0.74ms |
| total | 7.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.27ms | 0.25ms | +0.02ms | +6.46% |
| p50 | 0.34ms | 0.31ms | +0.02ms | +7.89% |
| p95 | 0.57ms | 0.53ms | +0.04ms | +7.33% |
| p99 | 0.71ms | 0.63ms | +0.08ms | +12.61% |
| mean | 0.38ms | 0.35ms | +0.03ms | +7.69% |
| min | 0.27ms | 0.25ms | +0.02ms | +6.09% |
| max | 0.74ms | 0.65ms | +0.09ms | +13.68% |
| total | 7.62ms | 7.07ms | +0.54ms | +7.69% |

### search_heavy_workload (50 docs + 50 search)

# Perf Report — search_heavy_workload (50 docs + 50 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.67ms |
| p50 | 0.74ms |
| p95 | 0.90ms |
| p99 | 0.94ms |
| mean | 0.77ms |
| stdev | 0.09ms |
| min | 0.67ms |
| max | 0.95ms |
| total | 15.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.67ms | 0.61ms | +0.06ms | +9.85% |
| p50 | 0.74ms | 0.65ms | +0.09ms | +13.74% |
| p95 | 0.90ms | 0.77ms | +0.13ms | +16.18% |
| p99 | 0.94ms | 1.21ms | -0.27ms | -22.34% |
| mean | 0.77ms | 0.68ms | +0.09ms | +12.66% |
| min | 0.67ms | 0.61ms | +0.06ms | +9.53% |
| max | 0.95ms | 1.31ms | -0.37ms | -28.01% |
| total | 15.36ms | 13.63ms | +1.73ms | +12.66% |

### filter_search_cycle (20 docs + 20 filtered search)

# Perf Report — filter_search_cycle (20 docs + 20 filtered search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.11ms |
| p50 | 0.19ms |
| p95 | 0.35ms |
| p99 | 0.49ms |
| mean | 0.20ms |
| stdev | 0.10ms |
| min | 0.10ms |
| max | 0.52ms |
| total | 3.91ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.10ms | +0.0029ms | +2.84% |
| p50 | 0.19ms | 0.18ms | +0.01ms | +6.97% |
| p95 | 0.35ms | 0.20ms | +0.15ms | +72.79% |
| p99 | 0.49ms | 0.29ms | +0.20ms | +70.14% |
| mean | 0.20ms | 0.16ms | +0.03ms | +21.06% |
| min | 0.10ms | 0.10ms | +0.0035ms | +3.49% |
| max | 0.52ms | 0.31ms | +0.21ms | +69.70% |
| total | 3.91ms | 3.23ms | +0.68ms | +21.06% |

