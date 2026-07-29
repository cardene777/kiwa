# Perf Suite — remix-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.03ms | 0.06ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| action_batch (5 invokeAction) | 0.01ms | 0.02ms | 100ms | 0.00042ms | PASS | stable (p10 +19% (閾値未満)、 p95 +34% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| loader_error_handling (5 throw + catch) | 0.03ms | 0.04ms | 100ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.16ms | 200ms | PASS |
| action_batch (5 invokeAction) | 0.06ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.13ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 7792 B | 0 B | 102400 B | yes | PASS |
| action_batch (5 invokeAction) | -22152 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | 1408 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.08ms |
| total | 0.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0024ms | -6.77% |
| p50 | 0.04ms | 0.04ms | +0.0037ms | +9.50% |
| p95 | 0.06ms | 0.06ms | +0.0040ms | +6.86% |
| p99 | 0.07ms | 0.06ms | +0.01ms | +24.67% |
| mean | 0.04ms | 0.04ms | +0.0024ms | +5.70% |
| min | 0.03ms | 0.03ms | +0.0012ms | +4.09% |
| max | 0.08ms | 0.06ms | +0.02ms | +28.94% |
| total | 0.89ms | 0.84ms | +0.05ms | +5.70% |

### action_batch (5 invokeAction)

# Perf Report — action_batch (5 invokeAction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0021ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0020ms | +18.83% |
| p50 | 0.01ms | 0.01ms | +0.0021ms | +20.15% |
| p95 | 0.02ms | 0.01ms | +0.0046ms | +34.28% |
| p99 | 0.02ms | 0.02ms | +0.0046ms | +30.30% |
| mean | 0.01ms | 0.01ms | +0.0025ms | +22.12% |
| min | 0.01ms | 0.01ms | +0.0021ms | +20.73% |
| max | 0.02ms | 0.02ms | +0.0046ms | +29.44% |
| total | 0.27ms | 0.22ms | +0.05ms | +22.12% |

### loader_error_handling (5 throw + catch)

# Perf Report — loader_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0029ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0058ms | +23.19% |
| p50 | 0.03ms | 0.03ms | +0.0059ms | +21.97% |
| p95 | 0.04ms | 0.03ms | +0.0060ms | +17.72% |
| p99 | 0.04ms | 0.04ms | +0.0030ms | +8.19% |
| mean | 0.03ms | 0.03ms | +0.0055ms | +19.48% |
| min | 0.03ms | 0.02ms | +0.0057ms | +23.46% |
| max | 0.04ms | 0.04ms | +0.0023ms | +6.06% |
| total | 0.67ms | 0.56ms | +0.11ms | +19.48% |

