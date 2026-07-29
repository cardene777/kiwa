# Perf Suite — fresh-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.12ms | 0.16ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| island_mount_batch (5 mountIsland with different props) | 0.0098ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.05ms | 0.06ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.89ms | 200ms | PASS |
| island_mount_batch (5 mountIsland with different props) | 0.05ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.22ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 42808 B | 0 B | 102400 B | yes | PASS |
| island_mount_batch (5 mountIsland with different props) | 22160 B | 0 B | 102400 B | yes | PASS |
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
| total | 2.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.12ms | 0.14ms | -0.02ms | -17.15% |
| p50 | 0.14ms | 0.16ms | -0.02ms | -13.75% |
| p95 | 0.16ms | 4.07ms | -3.90ms | -95.97% |
| p99 | 0.17ms | 5.06ms | -4.89ms | -96.62% |
| mean | 0.14ms | 0.75ms | -0.61ms | -81.16% |
| min | 0.11ms | 0.14ms | -0.02ms | -15.92% |
| max | 0.17ms | 5.31ms | -5.14ms | -96.74% |
| total | 2.81ms | 14.92ms | -12.11ms | -81.16% |

### island_mount_batch (5 mountIsland with different props)

# Perf Report — island_mount_batch (5 mountIsland with different props).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0098ms |
| p50 | 0.010ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0027ms |
| min | 0.0097ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0098ms | 0.010ms | -0.00017ms | -1.71% |
| p50 | 0.010ms | 0.03ms | -0.02ms | -68.65% |
| p95 | 0.02ms | 0.71ms | -0.69ms | -97.51% |
| p99 | 0.02ms | 10.98ms | -10.96ms | -99.83% |
| mean | 0.01ms | 0.70ms | -0.69ms | -98.39% |
| min | 0.0097ms | 0.0098ms | -0.00017ms | -1.70% |
| max | 0.02ms | 13.55ms | -13.53ms | -99.86% |
| total | 0.23ms | 14.03ms | -13.81ms | -98.39% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.06ms |
| p99 | 0.07ms |
| mean | 0.05ms |
| stdev | 0.0063ms |
| min | 0.05ms |
| max | 0.07ms |
| total | 1.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0020ms | -4.06% |
| p50 | 0.05ms | 0.06ms | -0.0064ms | -11.10% |
| p95 | 0.06ms | 1.32ms | -1.26ms | -95.28% |
| p99 | 0.07ms | 1.92ms | -1.85ms | -96.27% |
| mean | 0.05ms | 0.35ms | -0.30ms | -85.09% |
| min | 0.05ms | 0.05ms | -0.0022ms | -4.49% |
| max | 0.07ms | 2.07ms | -2.00ms | -96.42% |
| total | 1.06ms | 7.09ms | -6.03ms | -85.09% |

