# Perf Suite — remix-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.03ms | 0.07ms | 100ms | 0.00050ms | PASS | stable (p10 -12% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| action_batch (5 invokeAction) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| loader_error_handling (5 throw + catch) | 0.03ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.15ms | 200ms | PASS |
| action_batch (5 invokeAction) | 0.08ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.12ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 23032 B | 0 B | 102400 B | yes | PASS |
| action_batch (5 invokeAction) | 256688 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | -3736 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### loader_workflow (10 invokeLoader)

# Perf Report — loader_workflow (10 invokeLoader).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.07ms |
| p99 | 0.08ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.08ms |
| total | 0.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0041ms | -11.68% |
| p50 | 0.04ms | 0.04ms | +0.00044ms | +1.12% |
| p95 | 0.07ms | 0.06ms | +0.01ms | +20.66% |
| p99 | 0.08ms | 0.06ms | +0.02ms | +25.61% |
| mean | 0.04ms | 0.04ms | +0.0024ms | +5.80% |
| min | 0.03ms | 0.03ms | -0.0000010ms | -0.00% |
| max | 0.08ms | 0.06ms | +0.02ms | +26.79% |
| total | 0.89ms | 0.84ms | +0.05ms | +5.80% |

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
| stdev | 0.0017ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0032ms | +30.31% |
| p50 | 0.01ms | 0.01ms | +0.0031ms | +29.16% |
| p95 | 0.02ms | 0.01ms | +0.0038ms | +27.96% |
| p99 | 0.02ms | 0.02ms | +0.0048ms | +31.14% |
| mean | 0.01ms | 0.01ms | +0.0032ms | +29.10% |
| min | 0.01ms | 0.01ms | +0.0033ms | +32.11% |
| max | 0.02ms | 0.02ms | +0.0050ms | +31.82% |
| total | 0.29ms | 0.22ms | +0.06ms | +29.10% |

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
| stdev | 0.0026ms |
| min | 0.03ms |
| max | 0.03ms |
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00043ms | +1.70% |
| p50 | 0.03ms | 0.03ms | -0.00079ms | -2.94% |
| p95 | 0.03ms | 0.03ms | -0.000031ms | -0.09% |
| p99 | 0.03ms | 0.04ms | -0.0030ms | -8.22% |
| mean | 0.03ms | 0.03ms | -0.00080ms | -2.84% |
| min | 0.03ms | 0.02ms | +0.0010ms | +4.11% |
| max | 0.03ms | 0.04ms | -0.0038ms | -10.03% |
| total | 0.55ms | 0.56ms | -0.02ms | -2.84% |

