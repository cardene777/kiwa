# Perf Suite — fresh-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.13ms | 0.17ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| island_mount_batch (5 mountIsland with different props) | 0.010ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.05ms | 0.05ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.60ms | 200ms | PASS |
| island_mount_batch (5 mountIsland with different props) | 0.06ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.20ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 52992 B | 0 B | 102400 B | yes | PASS |
| island_mount_batch (5 mountIsland with different props) | 21584 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | -4872 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### handler_workflow (10 invokeFreshHandler GET+POST mix)

# Perf Report — handler_workflow (10 invokeFreshHandler GET+POST mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.13ms |
| p50 | 0.15ms |
| p95 | 0.17ms |
| p99 | 0.19ms |
| mean | 0.15ms |
| stdev | 0.02ms |
| min | 0.12ms |
| max | 0.19ms |
| total | 2.96ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.13ms | 0.14ms | -0.02ms | -11.42% |
| p50 | 0.15ms | 0.16ms | -0.02ms | -9.60% |
| p95 | 0.17ms | 4.07ms | -3.90ms | -95.82% |
| p99 | 0.19ms | 5.06ms | -4.88ms | -96.34% |
| mean | 0.15ms | 0.75ms | -0.60ms | -80.15% |
| min | 0.12ms | 0.14ms | -0.02ms | -13.21% |
| max | 0.19ms | 5.31ms | -5.12ms | -96.44% |
| total | 2.96ms | 14.92ms | -11.96ms | -80.15% |

### island_mount_batch (5 mountIsland with different props)

# Perf Report — island_mount_batch (5 mountIsland with different props).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.010ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0027ms |
| min | 0.0098ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.010ms | 0.010ms | -0.000042ms | -0.42% |
| p50 | 0.01ms | 0.03ms | -0.02ms | -65.44% |
| p95 | 0.02ms | 0.71ms | -0.69ms | -97.33% |
| p99 | 0.02ms | 10.98ms | -10.96ms | -99.82% |
| mean | 0.01ms | 0.70ms | -0.69ms | -98.32% |
| min | 0.0098ms | 0.0098ms | -0.000041ms | -0.42% |
| max | 0.02ms | 13.55ms | -13.53ms | -99.86% |
| total | 0.24ms | 14.03ms | -13.80ms | -98.32% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.05ms |
| stdev | 0.0028ms |
| min | 0.05ms |
| max | 0.06ms |
| total | 1.00ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0030ms | -5.96% |
| p50 | 0.05ms | 0.06ms | -0.0070ms | -12.19% |
| p95 | 0.05ms | 1.32ms | -1.26ms | -95.87% |
| p99 | 0.06ms | 1.92ms | -1.87ms | -97.12% |
| mean | 0.05ms | 0.35ms | -0.30ms | -85.82% |
| min | 0.05ms | 0.05ms | -0.0017ms | -3.54% |
| max | 0.06ms | 2.07ms | -2.02ms | -97.32% |
| total | 1.00ms | 7.09ms | -6.08ms | -85.82% |

