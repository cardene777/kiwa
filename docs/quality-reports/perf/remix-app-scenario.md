# Perf Suite — remix-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.03ms | 0.05ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| action_batch (5 invokeAction) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| loader_error_handling (5 throw + catch) | 0.03ms | 0.06ms | 100ms | 0.00050ms | PASS | stable (p10 +5% (閾値未満)、 p95 +87% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.14ms | 200ms | PASS |
| action_batch (5 invokeAction) | 0.07ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.12ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 1088 B | 0 B | 102400 B | yes | PASS |
| action_batch (5 invokeAction) | 2728 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | 2328 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### loader_workflow (10 invokeLoader)

# Perf Report — loader_workflow (10 invokeLoader).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.04ms |
| stdev | 0.0090ms |
| min | 0.03ms |
| max | 0.07ms |
| total | 0.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0026ms | -7.49% |
| p50 | 0.04ms | 0.04ms | -0.0022ms | -5.60% |
| p95 | 0.05ms | 0.06ms | -0.0075ms | -13.06% |
| p99 | 0.06ms | 0.06ms | +0.0051ms | +8.57% |
| mean | 0.04ms | 0.04ms | -0.0017ms | -4.12% |
| min | 0.03ms | 0.03ms | -0.00042ms | -1.46% |
| max | 0.07ms | 0.06ms | +0.0083ms | +13.74% |
| total | 0.81ms | 0.84ms | -0.03ms | -4.12% |

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
| stdev | 0.0015ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0031ms | +29.91% |
| p50 | 0.01ms | 0.01ms | +0.0033ms | +30.92% |
| p95 | 0.02ms | 0.01ms | +0.0039ms | +29.20% |
| p99 | 0.02ms | 0.02ms | +0.0037ms | +23.94% |
| mean | 0.01ms | 0.01ms | +0.0034ms | +30.63% |
| min | 0.01ms | 0.01ms | +0.0032ms | +31.31% |
| max | 0.02ms | 0.02ms | +0.0036ms | +22.81% |
| total | 0.29ms | 0.22ms | +0.07ms | +30.63% |

### loader_error_handling (5 throw + catch)

# Perf Report — loader_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.06ms |
| p99 | 0.20ms |
| mean | 0.04ms |
| stdev | 0.05ms |
| min | 0.03ms |
| max | 0.24ms |
| total | 0.83ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0012ms | +4.93% |
| p50 | 0.03ms | 0.03ms | +0.0011ms | +4.10% |
| p95 | 0.06ms | 0.03ms | +0.03ms | +86.73% |
| p99 | 0.20ms | 0.04ms | +0.16ms | +443.56% |
| mean | 0.04ms | 0.03ms | +0.01ms | +47.58% |
| min | 0.03ms | 0.02ms | +0.0018ms | +7.20% |
| max | 0.24ms | 0.04ms | +0.20ms | +523.15% |
| total | 0.83ms | 0.56ms | +0.27ms | +47.58% |

