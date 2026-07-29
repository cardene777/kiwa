# Perf Suite — grpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeUnary | 0.00050ms | 0.0058ms | 5ms | 0.00034ms | PASS | stable (p10 -4% (閾値未満)、 p95 +90% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeServerStream | 0.00088ms | 0.0023ms | 5ms | 0.00036ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| invokeUnary | cpu | 0.08ms | 0.00050ms | 0.006 | 0.006 | 0.00052ms | 0.00054ms |
| invokeServerStream | cpu | 0.08ms | 0.00088ms | 0.011 | 0.011 | 0.00096ms | 0.00096ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeUnary | 0.09ms | 10ms | PASS |
| invokeServerStream | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeUnary | -11168 B | 0 B | 102400 B | yes | PASS |
| invokeServerStream | -552 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeUnary

# Perf Report — invokeUnary.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0058ms |
| p99 | 0.01ms |
| mean | 0.0015ms |
| stdev | 0.0028ms |
| min | 0.00046ms |
| max | 0.02ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00054ms | -0.000041ms | -7.58% |
| p50 | 0.00054ms | 0.00058ms | -0.000042ms | -7.19% |
| p95 | 0.0058ms | 0.0032ms | +0.0027ms | +83.46% |
| p99 | 0.01ms | 0.02ms | -0.00060ms | -3.93% |
| mean | 0.0015ms | 0.0013ms | +0.00015ms | +11.26% |
| min | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| max | 0.02ms | 0.02ms | +0.0042ms | +24.88% |
| total | 0.30ms | 0.27ms | +0.03ms | +11.26% |

### invokeServerStream

# Perf Report — invokeServerStream.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.00096ms |
| p95 | 0.0023ms |
| p99 | 0.01ms |
| mean | 0.0013ms |
| stdev | 0.0019ms |
| min | 0.00079ms |
| max | 0.02ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00096ms | -0.000083ms | -8.66% |
| p50 | 0.00096ms | 0.0010ms | -0.000042ms | -4.20% |
| p95 | 0.0023ms | 0.0028ms | -0.00051ms | -18.54% |
| p99 | 0.01ms | 0.0091ms | +0.0028ms | +30.27% |
| mean | 0.0013ms | 0.0014ms | -0.000063ms | -4.51% |
| min | 0.00079ms | 0.00092ms | -0.00013ms | -13.65% |
| max | 0.02ms | 0.02ms | +0.0010ms | +6.01% |
| total | 0.27ms | 0.28ms | -0.01ms | -4.51% |

