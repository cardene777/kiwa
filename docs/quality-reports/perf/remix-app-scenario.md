# Perf Suite — remix-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.03ms | 0.06ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| action_batch (5 invokeAction) | 0.02ms | 0.02ms | 100ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| loader_error_handling (5 throw + catch) | 0.03ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.15ms | 200ms | PASS |
| action_batch (5 invokeAction) | 0.07ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 2184 B | 0 B | 102400 B | yes | PASS |
| action_batch (5 invokeAction) | 3976 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | 896 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.84ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.00059ms | -1.68% |
| p50 | 0.04ms | 0.04ms | -0.0026ms | -6.67% |
| p95 | 0.06ms | 0.06ms | +0.0048ms | +8.34% |
| p99 | 0.07ms | 0.06ms | +0.0097ms | +16.15% |
| mean | 0.04ms | 0.04ms | -0.000098ms | -0.23% |
| min | 0.03ms | 0.03ms | +0.0011ms | +3.79% |
| max | 0.07ms | 0.06ms | +0.01ms | +18.02% |
| total | 0.84ms | 0.84ms | -0.0020ms | -0.23% |

### action_batch (5 invokeAction)

# Perf Report — action_batch (5 invokeAction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0045ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0049ms | +47.33% |
| p50 | 0.02ms | 0.01ms | +0.0054ms | +50.30% |
| p95 | 0.02ms | 0.01ms | +0.0068ms | +50.66% |
| p99 | 0.03ms | 0.02ms | +0.02ms | +115.51% |
| mean | 0.02ms | 0.01ms | +0.0060ms | +54.09% |
| min | 0.02ms | 0.01ms | +0.0048ms | +47.16% |
| max | 0.04ms | 0.02ms | +0.02ms | +129.43% |
| total | 0.34ms | 0.22ms | +0.12ms | +54.09% |

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
| stdev | 0.0021ms |
| min | 0.03ms |
| max | 0.03ms |
| total | 0.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0013ms | +5.14% |
| p50 | 0.03ms | 0.03ms | -0.000062ms | -0.23% |
| p95 | 0.03ms | 0.03ms | -0.00084ms | -2.49% |
| p99 | 0.03ms | 0.04ms | -0.0034ms | -9.29% |
| mean | 0.03ms | 0.03ms | -0.00013ms | -0.47% |
| min | 0.03ms | 0.02ms | +0.0020ms | +8.05% |
| max | 0.03ms | 0.04ms | -0.0041ms | -10.81% |
| total | 0.56ms | 0.56ms | -0.0027ms | -0.47% |

