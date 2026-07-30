# Perf Suite — qwikcity

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeRouteLoader | 0.00079ms | 0.0046ms | 5ms | 0.00032ms | PASS | stable (換算後 p10 +8% (閾値未満)、 p95 +87% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeRouteAction | 0.00071ms | 0.0059ms | 5ms | 0.00032ms | PASS | stable (換算後 p10 +4% (閾値未満)、 p95 +59% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| invokeRouteLoader | cpu | 0.08ms | 0.09ms | 0.00079ms | 0.010 | 0.009 | 0.00077ms | 0.00071ms |
| invokeRouteAction | cpu | 0.08ms | 0.09ms | 0.00071ms | 0.009 | 0.008 | 0.00069ms | 0.00067ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRouteLoader | 0.03ms | 10ms | PASS |
| invokeRouteAction | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRouteLoader | -15392 B | 0 B | 102400 B | yes | PASS |
| invokeRouteAction | 280 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeRouteLoader

# Perf Report — invokeRouteLoader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00079ms |
| p50 | 0.00092ms |
| p95 | 0.0046ms |
| p99 | 0.02ms |
| mean | 0.0017ms |
| stdev | 0.0031ms |
| min | 0.00075ms |
| max | 0.03ms |
| total | 0.34ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.968)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00077ms | 0.00071ms | +0.000059ms | +8.28% |
| p50 | 0.00089ms | 0.00079ms | +0.000095ms | +12.01% |
| p95 | 0.0045ms | 0.0024ms | +0.0021ms | +87.05% |
| p99 | 0.02ms | 0.0092ms | +0.0093ms | +101.45% |
| mean | 0.0016ms | 0.0011ms | +0.00050ms | +44.01% |
| min | 0.00073ms | 0.00067ms | +0.000060ms | +9.00% |
| max | 0.02ms | 0.01ms | +0.01ms | +74.11% |
| total | 0.33ms | 0.23ms | +0.10ms | +44.01% |

### invokeRouteAction

# Perf Report — invokeRouteAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00071ms |
| p50 | 0.00083ms |
| p95 | 0.0059ms |
| p99 | 0.02ms |
| mean | 0.0019ms |
| stdev | 0.0044ms |
| min | 0.00067ms |
| max | 0.04ms |
| total | 0.38ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.976)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00069ms | 0.00067ms | +0.000026ms | +3.93% |
| p50 | 0.00081ms | 0.00071ms | +0.00011ms | +14.84% |
| p95 | 0.0058ms | 0.0036ms | +0.0021ms | +58.50% |
| p99 | 0.02ms | 0.01ms | +0.0083ms | +57.04% |
| mean | 0.0019ms | 0.0013ms | +0.00057ms | +44.15% |
| min | 0.00065ms | 0.00063ms | +0.000025ms | +4.03% |
| max | 0.04ms | 0.03ms | +0.0094ms | +33.55% |
| total | 0.37ms | 0.26ms | +0.11ms | +44.15% |

