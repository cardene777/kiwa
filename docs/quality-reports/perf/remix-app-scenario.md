# Perf Suite — remix-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.03ms | 0.23ms | 100ms | 0.00050ms | PASS | stable (p10 -4% (閾値未満)、 p95 +300% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| action_batch (5 invokeAction) | 0.02ms | 0.05ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| loader_error_handling (5 throw + catch) | 0.03ms | 0.05ms | 100ms | 0.00050ms | PASS | stable (p10 +17% (閾値未満)、 p95 +47% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.23ms | 200ms | PASS |
| action_batch (5 invokeAction) | 0.08ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.16ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 2384 B | 0 B | 102400 B | yes | PASS |
| action_batch (5 invokeAction) | 3520 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | 640 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### loader_workflow (10 invokeLoader)

# Perf Report — loader_workflow (10 invokeLoader).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.23ms |
| p99 | 0.29ms |
| mean | 0.09ms |
| stdev | 0.08ms |
| min | 0.03ms |
| max | 0.31ms |
| total | 1.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0015ms | -4.15% |
| p50 | 0.04ms | 0.04ms | +0.0047ms | +12.01% |
| p95 | 0.23ms | 0.06ms | +0.17ms | +299.51% |
| p99 | 0.29ms | 0.06ms | +0.23ms | +390.73% |
| mean | 0.09ms | 0.04ms | +0.04ms | +105.49% |
| min | 0.03ms | 0.03ms | +0.0043ms | +15.04% |
| max | 0.31ms | 0.06ms | +0.25ms | +412.56% |
| total | 1.73ms | 0.84ms | +0.89ms | +105.49% |

### action_batch (5 invokeAction)

# Perf Report — action_batch (5 invokeAction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.05ms |
| p99 | 0.20ms |
| mean | 0.03ms |
| stdev | 0.05ms |
| min | 0.02ms |
| max | 0.24ms |
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0062ms | +59.37% |
| p50 | 0.02ms | 0.01ms | +0.0066ms | +62.42% |
| p95 | 0.05ms | 0.01ms | +0.03ms | +239.92% |
| p99 | 0.20ms | 0.02ms | +0.19ms | +1219.56% |
| mean | 0.03ms | 0.01ms | +0.02ms | +165.60% |
| min | 0.02ms | 0.01ms | +0.0062ms | +60.57% |
| max | 0.24ms | 0.02ms | +0.22ms | +1429.91% |
| total | 0.59ms | 0.22ms | +0.37ms | +165.60% |

### loader_error_handling (5 throw + catch)

# Perf Report — loader_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.16ms |
| mean | 0.04ms |
| stdev | 0.04ms |
| min | 0.03ms |
| max | 0.19ms |
| total | 0.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0044ms | +17.35% |
| p50 | 0.03ms | 0.03ms | +0.0032ms | +11.91% |
| p95 | 0.05ms | 0.03ms | +0.02ms | +46.96% |
| p99 | 0.16ms | 0.04ms | +0.12ms | +333.99% |
| mean | 0.04ms | 0.03ms | +0.01ms | +41.48% |
| min | 0.03ms | 0.02ms | +0.0050ms | +20.72% |
| max | 0.19ms | 0.04ms | +0.15ms | +398.01% |
| total | 0.80ms | 0.56ms | +0.23ms | +41.48% |

