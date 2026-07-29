# Perf Suite — fresh-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.12ms | 0.18ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| island_mount_batch (5 mountIsland with different props) | 0.01ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.05ms | 0.06ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.97ms | 200ms | PASS |
| island_mount_batch (5 mountIsland with different props) | 0.05ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.25ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 54824 B | 2800 B | 102400 B | yes | PASS |
| island_mount_batch (5 mountIsland with different props) | -87264 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | -15488 B | 2100 B | 102400 B | yes | PASS |

## Detailed serial reports

### handler_workflow (10 invokeFreshHandler GET+POST mix)

# Perf Report — handler_workflow (10 invokeFreshHandler GET+POST mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.12ms |
| p50 | 0.15ms |
| p95 | 0.18ms |
| p99 | 0.23ms |
| mean | 0.15ms |
| stdev | 0.03ms |
| min | 0.12ms |
| max | 0.25ms |
| total | 3.00ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.12ms | 0.14ms | -0.02ms | -14.32% |
| p50 | 0.15ms | 0.16ms | -0.01ms | -8.02% |
| p95 | 0.18ms | 4.07ms | -3.89ms | -95.66% |
| p99 | 0.23ms | 5.06ms | -4.83ms | -95.40% |
| mean | 0.15ms | 0.75ms | -0.60ms | -79.87% |
| min | 0.12ms | 0.14ms | -0.02ms | -15.16% |
| max | 0.25ms | 5.31ms | -5.06ms | -95.35% |
| total | 3.00ms | 14.92ms | -11.92ms | -79.87% |

### island_mount_batch (5 mountIsland with different props)

# Perf Report — island_mount_batch (5 mountIsland with different props).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0012ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.010ms | +0.0041ms | +40.85% |
| p50 | 0.02ms | 0.03ms | -0.02ms | -52.62% |
| p95 | 0.02ms | 0.71ms | -0.69ms | -97.68% |
| p99 | 0.02ms | 10.98ms | -10.96ms | -99.83% |
| mean | 0.02ms | 0.70ms | -0.69ms | -97.83% |
| min | 0.01ms | 0.0098ms | +0.0037ms | +38.14% |
| max | 0.02ms | 13.55ms | -13.53ms | -99.86% |
| total | 0.30ms | 14.03ms | -13.73ms | -97.83% |

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
| stdev | 0.0020ms |
| min | 0.05ms |
| max | 0.06ms |
| total | 1.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | +0.0023ms | +4.67% |
| p50 | 0.05ms | 0.06ms | -0.0038ms | -6.55% |
| p95 | 0.06ms | 1.32ms | -1.26ms | -95.60% |
| p99 | 0.06ms | 1.92ms | -1.86ms | -96.96% |
| mean | 0.05ms | 0.35ms | -0.30ms | -84.71% |
| min | 0.05ms | 0.05ms | +0.0037ms | +7.59% |
| max | 0.06ms | 2.07ms | -2.02ms | -97.18% |
| total | 1.08ms | 7.09ms | -6.00ms | -84.71% |

