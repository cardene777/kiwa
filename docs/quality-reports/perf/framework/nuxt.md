# Perf Suite — nuxt

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeEventHandler | 0.00092ms | 0.0067ms | 5ms | 0.00033ms | PASS | stable (換算後 p10 +3% (閾値未満)、 p95 +49% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeRouteMiddleware | 0.00054ms | 0.0030ms | 5ms | 0.00033ms | PASS | stable (換算後 p10 -2% (閾値未満)、 p95 +35% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| invokeEventHandler | cpu | 0.08ms | 0.09ms | 0.00092ms | 0.011 | 0.011 | 0.00090ms | 0.00088ms |
| invokeRouteMiddleware | cpu | 0.08ms | 0.09ms | 0.00054ms | 0.007 | 0.007 | 0.00053ms | 0.00054ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEventHandler | 0.03ms | 10ms | PASS |
| invokeRouteMiddleware | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeEventHandler | -16232 B | 0 B | 102400 B | yes | PASS |
| invokeRouteMiddleware | -392 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeEventHandler

# Perf Report — invokeEventHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00092ms |
| p50 | 0.0012ms |
| p95 | 0.0067ms |
| p99 | 0.03ms |
| mean | 0.0023ms |
| stdev | 0.0037ms |
| min | 0.00083ms |
| max | 0.03ms |
| total | 0.45ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.987)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00090ms | 0.00088ms | +0.000030ms | +3.40% |
| p50 | 0.0012ms | 0.00092ms | +0.00023ms | +25.51% |
| p95 | 0.0066ms | 0.0044ms | +0.0022ms | +49.21% |
| p99 | 0.02ms | 0.02ms | +0.0091ms | +56.95% |
| mean | 0.0022ms | 0.0016ms | +0.00063ms | +39.17% |
| min | 0.00082ms | 0.00083ms | -0.000011ms | -1.34% |
| max | 0.03ms | 0.02ms | +0.0098ms | +44.36% |
| total | 0.45ms | 0.32ms | +0.13ms | +39.17% |

### invokeRouteMiddleware

# Perf Report — invokeRouteMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0030ms |
| p99 | 0.01ms |
| mean | 0.0011ms |
| stdev | 0.0028ms |
| min | 0.00050ms |
| max | 0.03ms |
| total | 0.22ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.983)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00053ms | 0.00054ms | -0.0000093ms | -1.73% |
| p50 | 0.00057ms | 0.00058ms | -0.0000091ms | -1.56% |
| p95 | 0.0030ms | 0.0022ms | +0.00077ms | +34.69% |
| p99 | 0.01ms | 0.0073ms | +0.0039ms | +53.54% |
| mean | 0.0011ms | 0.00087ms | +0.00021ms | +23.83% |
| min | 0.00049ms | 0.00050ms | -0.0000086ms | -1.73% |
| max | 0.03ms | 0.0081ms | +0.03ms | +317.79% |
| total | 0.21ms | 0.17ms | +0.04ms | +23.83% |

