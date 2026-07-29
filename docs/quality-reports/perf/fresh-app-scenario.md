# Perf Suite — fresh-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.13ms | 0.21ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| island_mount_batch (5 mountIsland with different props) | 0.0096ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.04ms | 0.05ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.70ms | 200ms | PASS |
| island_mount_batch (5 mountIsland with different props) | 0.05ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.19ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 42456 B | 0 B | 102400 B | yes | PASS |
| island_mount_batch (5 mountIsland with different props) | 21360 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | -3936 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### handler_workflow (10 invokeFreshHandler GET+POST mix)

# Perf Report — handler_workflow (10 invokeFreshHandler GET+POST mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.13ms |
| p50 | 0.15ms |
| p95 | 0.21ms |
| p99 | 0.24ms |
| mean | 0.16ms |
| stdev | 0.03ms |
| min | 0.12ms |
| max | 0.25ms |
| total | 3.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.13ms | 0.14ms | -0.01ms | -10.33% |
| p50 | 0.15ms | 0.16ms | -0.01ms | -8.80% |
| p95 | 0.21ms | 4.07ms | -3.86ms | -94.77% |
| p99 | 0.24ms | 5.06ms | -4.82ms | -95.24% |
| mean | 0.16ms | 0.75ms | -0.59ms | -78.98% |
| min | 0.12ms | 0.14ms | -0.02ms | -14.00% |
| max | 0.25ms | 5.31ms | -5.06ms | -95.33% |
| total | 3.14ms | 14.92ms | -11.78ms | -78.98% |

### island_mount_batch (5 mountIsland with different props)

# Perf Report — island_mount_batch (5 mountIsland with different props).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0096ms |
| p50 | 0.0099ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0028ms |
| min | 0.0096ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0096ms | 0.010ms | -0.00037ms | -3.75% |
| p50 | 0.0099ms | 0.03ms | -0.02ms | -69.04% |
| p95 | 0.02ms | 0.71ms | -0.69ms | -97.57% |
| p99 | 0.02ms | 10.98ms | -10.96ms | -99.82% |
| mean | 0.01ms | 0.70ms | -0.69ms | -98.42% |
| min | 0.0096ms | 0.0098ms | -0.00025ms | -2.54% |
| max | 0.02ms | 13.55ms | -13.53ms | -99.85% |
| total | 0.22ms | 14.03ms | -13.81ms | -98.42% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.05ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.05ms |
| stdev | 0.0022ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.92ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.05ms | -0.0053ms | -10.63% |
| p50 | 0.05ms | 0.06ms | -0.01ms | -20.71% |
| p95 | 0.05ms | 1.32ms | -1.27ms | -96.16% |
| p99 | 0.05ms | 1.92ms | -1.87ms | -97.26% |
| mean | 0.05ms | 0.35ms | -0.31ms | -87.00% |
| min | 0.04ms | 0.05ms | -0.0038ms | -7.85% |
| max | 0.05ms | 2.07ms | -2.02ms | -97.44% |
| total | 0.92ms | 7.09ms | -6.17ms | -87.00% |

