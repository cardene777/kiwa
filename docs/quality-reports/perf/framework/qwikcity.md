# Perf Suite — qwikcity

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeRouteLoader | 0.00071ms | 0.0035ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeRouteAction | 0.00063ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| invokeRouteLoader | cpu | 0.08ms | 0.00071ms | 0.009 | 0.010 | 0.00072ms | 0.00079ms |
| invokeRouteAction | cpu | 0.08ms | 0.00063ms | 0.008 | 0.008 | 0.00063ms | 0.00067ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRouteLoader | 0.02ms | 10ms | PASS |
| invokeRouteAction | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRouteLoader | -26016 B | 0 B | 102400 B | yes | PASS |
| invokeRouteAction | -408 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeRouteLoader

# Perf Report — invokeRouteLoader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00071ms |
| p50 | 0.00075ms |
| p95 | 0.0035ms |
| p99 | 0.02ms |
| mean | 0.0013ms |
| stdev | 0.0024ms |
| min | 0.00071ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00071ms | 0.00079ms | -0.000082ms | -10.37% |
| p50 | 0.00075ms | 0.00088ms | -0.00013ms | -14.29% |
| p95 | 0.0035ms | 0.0035ms | -0.000063ms | -1.79% |
| p99 | 0.02ms | 0.02ms | -0.0012ms | -7.07% |
| mean | 0.0013ms | 0.0015ms | -0.00017ms | -11.27% |
| min | 0.00071ms | 0.00075ms | -0.000042ms | -5.60% |
| max | 0.02ms | 0.02ms | -0.0012ms | -6.16% |
| total | 0.26ms | 0.30ms | -0.03ms | -11.27% |

### invokeRouteAction

# Perf Report — invokeRouteAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00067ms |
| p95 | 0.0013ms |
| p99 | 0.0068ms |
| mean | 0.00091ms |
| stdev | 0.0012ms |
| min | 0.00063ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00067ms | -0.000042ms | -6.30% |
| p50 | 0.00067ms | 0.00075ms | -0.000083ms | -11.07% |
| p95 | 0.0013ms | 0.0034ms | -0.0020ms | -60.39% |
| p99 | 0.0068ms | 0.0095ms | -0.0027ms | -28.36% |
| mean | 0.00091ms | 0.0012ms | -0.00030ms | -24.57% |
| min | 0.00063ms | 0.00067ms | -0.000041ms | -6.16% |
| max | 0.01ms | 0.03ms | -0.02ms | -55.57% |
| total | 0.18ms | 0.24ms | -0.06ms | -24.57% |

