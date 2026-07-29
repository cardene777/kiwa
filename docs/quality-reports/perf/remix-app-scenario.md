# Perf Suite — remix-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.03ms | 0.05ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| action_batch (5 invokeAction) | 0.02ms | 0.02ms | 100ms | 0.00049ms | PASS | stable (p10 +12% (閾値未満)、 p95 +22% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| loader_error_handling (5 throw + catch) | 0.02ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | cpu | 0.08ms | 0.03ms | 0.419 | 0.390 | 0.03ms | 0.03ms |
| action_batch (5 invokeAction) | cpu | 0.08ms | 0.02ms | 0.189 | 0.169 | 0.02ms | 0.01ms |
| loader_error_handling (5 throw + catch) | cpu | 0.08ms | 0.02ms | 0.291 | 0.330 | 0.02ms | 0.03ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.23ms | 200ms | PASS |
| action_batch (5 invokeAction) | 0.07ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.13ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 4632 B | 0 B | 102400 B | yes | PASS |
| action_batch (5 invokeAction) | 1000 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | 928 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.0046ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.75ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0027ms | +8.59% |
| p50 | 0.04ms | 0.04ms | +0.00023ms | +0.63% |
| p95 | 0.05ms | 0.05ms | -0.0030ms | -6.06% |
| p99 | 0.05ms | 0.05ms | -0.0012ms | -2.43% |
| mean | 0.04ms | 0.04ms | +0.00048ms | +1.28% |
| min | 0.03ms | 0.03ms | -0.00025ms | -0.84% |
| max | 0.05ms | 0.05ms | -0.00075ms | -1.53% |
| total | 0.75ms | 0.74ms | +0.0095ms | +1.28% |

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
| stdev | 0.0013ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0018ms | +13.07% |
| p50 | 0.02ms | 0.01ms | +0.0026ms | +18.91% |
| p95 | 0.02ms | 0.02ms | +0.0034ms | +22.84% |
| p99 | 0.02ms | 0.02ms | +0.0032ms | +20.69% |
| mean | 0.02ms | 0.01ms | +0.0025ms | +17.77% |
| min | 0.01ms | 0.01ms | +0.00013ms | +0.94% |
| max | 0.02ms | 0.02ms | +0.0031ms | +20.16% |
| total | 0.33ms | 0.28ms | +0.05ms | +17.77% |

### loader_error_handling (5 throw + catch)

# Perf Report — loader_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.0025ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.03ms | -0.0030ms | -11.39% |
| p50 | 0.02ms | 0.03ms | -0.0023ms | -8.51% |
| p95 | 0.03ms | 0.03ms | -0.0012ms | -3.59% |
| p99 | 0.03ms | 0.04ms | -0.0098ms | -23.15% |
| mean | 0.03ms | 0.03ms | -0.0028ms | -9.69% |
| min | 0.02ms | 0.03ms | -0.0032ms | -12.11% |
| max | 0.03ms | 0.05ms | -0.01ms | -26.64% |
| total | 0.52ms | 0.57ms | -0.06ms | -9.69% |

