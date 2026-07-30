# Perf Suite — remix-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00037ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00073ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.04ms | 0.17ms | 100ms | 0.00069ms | PASS | stable (換算後 p10 +8% (閾値未満)、 p95 +149% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| action_batch (5 invokeAction) | 0.01ms | 0.03ms | 100ms | 0.00071ms | PASS | improved — gate 無効 (regressionGate=false) |
| loader_error_handling (5 throw + catch) | 0.03ms | 0.04ms | 100ms | 0.00068ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | cpu | 0.09ms | 0.24ms | 0.04ms | 0.410 | 0.381 | 0.03ms | 0.03ms |
| action_batch (5 invokeAction) | cpu | 0.09ms | 0.09ms | 0.01ms | 0.134 | 0.169 | 0.01ms | 0.01ms |
| loader_error_handling (5 throw + catch) | cpu | 0.09ms | 0.09ms | 0.03ms | 0.320 | 0.320 | 0.03ms | 0.03ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.32ms | 200ms | PASS |
| action_batch (5 invokeAction) | 0.07ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.16ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 96 B | 0 B | 102400 B | yes | PASS |
| action_batch (5 invokeAction) | -24584 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | 416 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### loader_workflow (10 invokeLoader)

# Perf Report — loader_workflow (10 invokeLoader).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.05ms |
| p95 | 0.17ms |
| p99 | 0.21ms |
| mean | 0.08ms |
| stdev | 0.05ms |
| min | 0.03ms |
| max | 0.22ms |
| total | 1.61ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.942)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0024ms | +7.83% |
| p50 | 0.05ms | 0.04ms | +0.01ms | +36.63% |
| p95 | 0.16ms | 0.06ms | +0.09ms | +149.41% |
| p99 | 0.20ms | 0.09ms | +0.11ms | +118.25% |
| mean | 0.08ms | 0.04ms | +0.04ms | +88.95% |
| min | 0.03ms | 0.03ms | +0.0038ms | +12.99% |
| max | 0.21ms | 0.10ms | +0.11ms | +113.22% |
| total | 1.52ms | 0.80ms | +0.72ms | +88.95% |

### action_batch (5 invokeAction)

# Perf Report — action_batch (5 invokeAction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.10ms |
| total | 0.34ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.965)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0029ms | -21.03% |
| p50 | 0.01ms | 0.01ms | -0.0032ms | -22.05% |
| p95 | 0.03ms | 0.03ms | -0.0035ms | -10.67% |
| p99 | 0.08ms | 0.05ms | +0.03ms | +77.38% |
| mean | 0.02ms | 0.02ms | -0.00079ms | -4.60% |
| min | 0.01ms | 0.01ms | -0.0027ms | -19.91% |
| max | 0.09ms | 0.05ms | +0.04ms | +92.08% |
| total | 0.33ms | 0.34ms | -0.02ms | -4.60% |

### loader_error_handling (5 throw + catch)

# Perf Report — loader_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0041ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.64ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.924)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.000028ms | +0.10% |
| p50 | 0.03ms | 0.03ms | +0.00052ms | +1.84% |
| p95 | 0.03ms | 0.09ms | -0.05ms | -62.68% |
| p99 | 0.04ms | 0.09ms | -0.05ms | -55.79% |
| mean | 0.03ms | 0.04ms | -0.0069ms | -18.99% |
| min | 0.03ms | 0.03ms | +0.00022ms | +0.84% |
| max | 0.04ms | 0.10ms | -0.05ms | -54.22% |
| total | 0.59ms | 0.73ms | -0.14ms | -18.99% |

