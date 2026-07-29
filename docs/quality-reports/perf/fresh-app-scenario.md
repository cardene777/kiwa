# Perf Suite — fresh-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00062ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.14ms | 0.55ms | 100ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |
| island_mount_batch (5 mountIsland with different props) | 0.01ms | 0.02ms | 100ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.05ms | 0.06ms | 100ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 1.26ms | 200ms | PASS |
| island_mount_batch (5 mountIsland with different props) | 0.06ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.20ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 49024 B | 854 B | 102400 B | yes | PASS |
| island_mount_batch (5 mountIsland with different props) | -101672 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 616 B | -3570 B | 102400 B | yes | PASS |

## Detailed serial reports

### handler_workflow (10 invokeFreshHandler GET+POST mix)

# Perf Report — handler_workflow (10 invokeFreshHandler GET+POST mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.14ms |
| p50 | 0.16ms |
| p95 | 0.55ms |
| p99 | 0.59ms |
| mean | 0.28ms |
| stdev | 0.17ms |
| min | 0.12ms |
| max | 0.60ms |
| total | 5.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.14ms | 0.14ms | -0.0036ms | -2.50% |
| p50 | 0.16ms | 0.16ms | -0.0019ms | -1.17% |
| p95 | 0.55ms | 4.07ms | -3.52ms | -86.52% |
| p99 | 0.59ms | 5.06ms | -4.47ms | -88.30% |
| mean | 0.28ms | 0.75ms | -0.47ms | -63.06% |
| min | 0.12ms | 0.14ms | -0.02ms | -11.04% |
| max | 0.60ms | 5.31ms | -4.71ms | -88.64% |
| total | 5.51ms | 14.92ms | -9.41ms | -63.06% |

### island_mount_batch (5 mountIsland with different props)

# Perf Report — island_mount_batch (5 mountIsland with different props).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0035ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.010ms | +0.0027ms | +26.93% |
| p50 | 0.01ms | 0.03ms | -0.02ms | -56.35% |
| p95 | 0.02ms | 0.71ms | -0.69ms | -96.62% |
| p99 | 0.02ms | 10.98ms | -10.96ms | -99.78% |
| mean | 0.02ms | 0.70ms | -0.69ms | -97.86% |
| min | 0.01ms | 0.0098ms | +0.0017ms | +16.95% |
| max | 0.02ms | 13.55ms | -13.53ms | -99.82% |
| total | 0.30ms | 14.03ms | -13.73ms | -97.86% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.06ms |
| p99 | 0.06ms |
| mean | 0.05ms |
| stdev | 0.0039ms |
| min | 0.05ms |
| max | 0.06ms |
| total | 1.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0024ms | -4.74% |
| p50 | 0.05ms | 0.06ms | -0.0079ms | -13.80% |
| p95 | 0.06ms | 1.32ms | -1.26ms | -95.69% |
| p99 | 0.06ms | 1.92ms | -1.86ms | -96.91% |
| mean | 0.05ms | 0.35ms | -0.30ms | -85.51% |
| min | 0.05ms | 0.05ms | -0.0015ms | -3.02% |
| max | 0.06ms | 2.07ms | -2.01ms | -97.10% |
| total | 1.03ms | 7.09ms | -6.06ms | -85.51% |

