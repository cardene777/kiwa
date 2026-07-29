# Perf Suite — remix-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.03ms | 0.08ms | 100ms | 0.00050ms | PASS | stable (p10 -2% (閾値未満)、 p95 +42% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| action_batch (5 invokeAction) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| loader_error_handling (5 throw + catch) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.13ms | 200ms | PASS |
| action_batch (5 invokeAction) | 0.08ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 1224 B | 0 B | 102400 B | yes | PASS |
| action_batch (5 invokeAction) | 2744 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | 8128 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### loader_workflow (10 invokeLoader)

# Perf Report — loader_workflow (10 invokeLoader).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.08ms |
| p99 | 0.09ms |
| mean | 0.05ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.09ms |
| total | 0.95ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.00059ms | -1.67% |
| p50 | 0.04ms | 0.04ms | +0.0041ms | +10.46% |
| p95 | 0.08ms | 0.06ms | +0.02ms | +41.71% |
| p99 | 0.09ms | 0.06ms | +0.03ms | +43.61% |
| mean | 0.05ms | 0.04ms | +0.0054ms | +12.80% |
| min | 0.03ms | 0.03ms | +0.0012ms | +4.38% |
| max | 0.09ms | 0.06ms | +0.03ms | +44.06% |
| total | 0.95ms | 0.84ms | +0.11ms | +12.80% |

### action_batch (5 invokeAction)

# Perf Report — action_batch (5 invokeAction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0014ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0032ms | +30.79% |
| p50 | 0.02ms | 0.01ms | +0.0050ms | +46.77% |
| p95 | 0.02ms | 0.01ms | +0.0040ms | +29.52% |
| p99 | 0.02ms | 0.02ms | +0.0025ms | +16.13% |
| mean | 0.02ms | 0.01ms | +0.0042ms | +37.27% |
| min | 0.01ms | 0.01ms | +0.0033ms | +32.53% |
| max | 0.02ms | 0.02ms | +0.0021ms | +13.25% |
| total | 0.31ms | 0.22ms | +0.08ms | +37.27% |

### loader_error_handling (5 throw + catch)

# Perf Report — loader_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0039ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.03ms | -0.00069ms | -2.75% |
| p50 | 0.03ms | 0.03ms | -0.0015ms | -5.72% |
| p95 | 0.03ms | 0.03ms | +0.0011ms | +3.32% |
| p99 | 0.04ms | 0.04ms | +0.00039ms | +1.06% |
| mean | 0.03ms | 0.03ms | -0.00093ms | -3.31% |
| min | 0.02ms | 0.02ms | +0.00013ms | +0.51% |
| max | 0.04ms | 0.04ms | +0.00021ms | +0.55% |
| total | 0.54ms | 0.56ms | -0.02ms | -3.31% |

