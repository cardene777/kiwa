# Perf Suite — search-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 0.32ms | 0.93ms | 100ms | 0.00049ms | PASS | regressed — gate 無効 (regressionGate=false) |
| search_heavy_workload (50 docs + 50 search) | 0.82ms | 2.60ms | 100ms | 0.00049ms | PASS | regressed — gate 無効 (regressionGate=false) |
| filter_search_cycle (20 docs + 20 filtered search) | 0.11ms | 1.59ms | 80ms | 0.00049ms | PASS | stable (p10 +3% (閾値未満)、 p95 +681% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 2.86ms | 200ms | PASS |
| search_heavy_workload (50 docs + 50 search) | 9.36ms | 200ms | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | 2.51ms | 160ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | -6576 B | 0 B | 102400 B | yes | PASS |
| search_heavy_workload (50 docs + 50 search) | -4248 B | 0 B | 102400 B | yes | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | 5464 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### index_build (100 docs addDocuments + 10 search)

# Perf Report — index_build (100 docs addDocuments + 10 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.32ms |
| p50 | 0.62ms |
| p95 | 0.93ms |
| p99 | 1.04ms |
| mean | 0.58ms |
| stdev | 0.22ms |
| min | 0.27ms |
| max | 1.07ms |
| total | 11.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.32ms | 0.25ms | +0.07ms | +26.35% |
| p50 | 0.62ms | 0.31ms | +0.31ms | +99.99% |
| p95 | 0.93ms | 0.53ms | +0.41ms | +76.80% |
| p99 | 1.04ms | 0.63ms | +0.41ms | +65.71% |
| mean | 0.58ms | 0.35ms | +0.23ms | +64.01% |
| min | 0.27ms | 0.25ms | +0.02ms | +7.59% |
| max | 1.07ms | 0.65ms | +0.41ms | +63.47% |
| total | 11.60ms | 7.07ms | +4.53ms | +64.01% |

### search_heavy_workload (50 docs + 50 search)

# Perf Report — search_heavy_workload (50 docs + 50 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.82ms |
| p50 | 1.20ms |
| p95 | 2.60ms |
| p99 | 3.05ms |
| mean | 1.41ms |
| stdev | 0.66ms |
| min | 0.73ms |
| max | 3.16ms |
| total | 28.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.82ms | 0.61ms | +0.21ms | +34.15% |
| p50 | 1.20ms | 0.65ms | +0.55ms | +84.05% |
| p95 | 2.60ms | 0.77ms | +1.83ms | +236.69% |
| p99 | 3.05ms | 1.21ms | +1.85ms | +153.12% |
| mean | 1.41ms | 0.68ms | +0.73ms | +107.16% |
| min | 0.73ms | 0.61ms | +0.12ms | +19.16% |
| max | 3.16ms | 1.31ms | +1.85ms | +140.83% |
| total | 28.24ms | 13.63ms | +14.61ms | +107.16% |

### filter_search_cycle (20 docs + 20 filtered search)

# Perf Report — filter_search_cycle (20 docs + 20 filtered search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.11ms |
| p50 | 0.35ms |
| p95 | 1.59ms |
| p99 | 1.94ms |
| mean | 0.62ms |
| stdev | 0.59ms |
| min | 0.10ms |
| max | 2.02ms |
| total | 12.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.10ms | +0.0031ms | +3.04% |
| p50 | 0.35ms | 0.18ms | +0.17ms | +97.13% |
| p95 | 1.59ms | 0.20ms | +1.39ms | +681.38% |
| p99 | 1.94ms | 0.29ms | +1.65ms | +577.12% |
| mean | 0.62ms | 0.16ms | +0.45ms | +280.91% |
| min | 0.10ms | 0.10ms | +0.0025ms | +2.50% |
| max | 2.02ms | 0.31ms | +1.72ms | +559.81% |
| total | 12.31ms | 3.23ms | +9.08ms | +280.91% |

