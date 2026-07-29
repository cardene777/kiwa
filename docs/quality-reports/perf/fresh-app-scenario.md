# Perf Suite — fresh-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.12ms | 0.16ms | 100ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| island_mount_batch (5 mountIsland with different props) | 0.01ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.05ms | 0.06ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.70ms | 200ms | PASS |
| island_mount_batch (5 mountIsland with different props) | 0.05ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.22ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 57008 B | 0 B | 102400 B | yes | PASS |
| island_mount_batch (5 mountIsland with different props) | 22168 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | -4408 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### handler_workflow (10 invokeFreshHandler GET+POST mix)

# Perf Report — handler_workflow (10 invokeFreshHandler GET+POST mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.12ms |
| p50 | 0.14ms |
| p95 | 0.16ms |
| p99 | 0.17ms |
| mean | 0.14ms |
| stdev | 0.02ms |
| min | 0.11ms |
| max | 0.17ms |
| total | 2.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.12ms | 0.14ms | -0.03ms | -20.39% |
| p50 | 0.14ms | 0.16ms | -0.02ms | -12.29% |
| p95 | 0.16ms | 4.07ms | -3.91ms | -96.15% |
| p99 | 0.17ms | 5.06ms | -4.90ms | -96.70% |
| mean | 0.14ms | 0.75ms | -0.61ms | -81.29% |
| min | 0.11ms | 0.14ms | -0.02ms | -16.99% |
| max | 0.17ms | 5.31ms | -5.14ms | -96.81% |
| total | 2.79ms | 14.92ms | -12.13ms | -81.29% |

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
| mean | 0.01ms |
| stdev | 0.0031ms |
| min | 0.0096ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.010ms | +0.00034ms | +3.37% |
| p50 | 0.01ms | 0.03ms | -0.02ms | -66.17% |
| p95 | 0.02ms | 0.71ms | -0.69ms | -97.37% |
| p99 | 0.02ms | 10.98ms | -10.96ms | -99.81% |
| mean | 0.01ms | 0.70ms | -0.69ms | -98.28% |
| min | 0.0096ms | 0.0098ms | -0.00021ms | -2.12% |
| max | 0.02ms | 13.55ms | -13.53ms | -99.85% |
| total | 0.24ms | 14.03ms | -13.79ms | -98.28% |

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
| stdev | 0.0053ms |
| min | 0.05ms |
| max | 0.06ms |
| total | 1.02ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0027ms | -5.34% |
| p50 | 0.05ms | 0.06ms | -0.0083ms | -14.56% |
| p95 | 0.06ms | 1.32ms | -1.26ms | -95.28% |
| p99 | 0.06ms | 1.92ms | -1.86ms | -96.70% |
| mean | 0.05ms | 0.35ms | -0.30ms | -85.57% |
| min | 0.05ms | 0.05ms | -0.0022ms | -4.57% |
| max | 0.06ms | 2.07ms | -2.01ms | -96.92% |
| total | 1.02ms | 7.09ms | -6.07ms | -85.57% |

