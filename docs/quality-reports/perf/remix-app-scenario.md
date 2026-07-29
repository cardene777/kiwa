# Perf Suite — remix-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.03ms | 0.06ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| action_batch (5 invokeAction) | 0.02ms | 0.02ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| loader_error_handling (5 throw + catch) | 0.03ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.16ms | 200ms | PASS |
| action_batch (5 invokeAction) | 0.07ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.12ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 3080 B | 0 B | 102400 B | yes | PASS |
| action_batch (5 invokeAction) | -4200 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | 1664 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### loader_workflow (10 invokeLoader)

# Perf Report — loader_workflow (10 invokeLoader).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.06ms |
| p99 | 0.07ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.07ms |
| total | 0.83ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0021ms | -6.06% |
| p50 | 0.04ms | 0.04ms | -0.00044ms | -1.12% |
| p95 | 0.06ms | 0.06ms | +0.0025ms | +4.38% |
| p99 | 0.07ms | 0.06ms | +0.01ms | +17.62% |
| mean | 0.04ms | 0.04ms | -0.00074ms | -1.75% |
| min | 0.03ms | 0.03ms | -0.00058ms | -2.04% |
| max | 0.07ms | 0.06ms | +0.01ms | +20.79% |
| total | 0.83ms | 0.84ms | -0.01ms | -1.75% |

### action_batch (5 invokeAction)

# Perf Report — action_batch (5 invokeAction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.00090ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0057ms | +54.95% |
| p50 | 0.02ms | 0.01ms | +0.0059ms | +55.38% |
| p95 | 0.02ms | 0.01ms | +0.0046ms | +34.00% |
| p99 | 0.02ms | 0.02ms | +0.0034ms | +22.17% |
| mean | 0.02ms | 0.01ms | +0.0056ms | +50.50% |
| min | 0.01ms | 0.01ms | +0.0043ms | +41.46% |
| max | 0.02ms | 0.02ms | +0.0031ms | +19.63% |
| total | 0.34ms | 0.22ms | +0.11ms | +50.50% |

### loader_error_handling (5 throw + catch)

# Perf Report — loader_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.0018ms |
| min | 0.03ms |
| max | 0.03ms |
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00081ms | +3.21% |
| p50 | 0.03ms | 0.03ms | -0.00044ms | -1.62% |
| p95 | 0.03ms | 0.03ms | -0.0016ms | -4.82% |
| p99 | 0.03ms | 0.04ms | -0.0048ms | -13.05% |
| mean | 0.03ms | 0.03ms | -0.00084ms | -2.97% |
| min | 0.03ms | 0.02ms | +0.0016ms | +6.68% |
| max | 0.03ms | 0.04ms | -0.0056ms | -14.89% |
| total | 0.55ms | 0.56ms | -0.02ms | -2.97% |

