# Perf Suite — fresh

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeFreshHandler | 0.0078ms | 0.04ms | 5ms | 0.00033ms | PASS | stable (p10 -6% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| mountIsland | 0.0013ms | 0.0028ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| invokeFreshHandler | cpu | 0.08ms | 0.0078ms | 0.094 | 0.100 | 0.0077ms | 0.0081ms |
| mountIsland | cpu | 0.08ms | 0.0013ms | 0.016 | 0.016 | 0.0013ms | 0.0013ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeFreshHandler | 0.26ms | 10ms | PASS |
| mountIsland | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeFreshHandler | -24336 B | -10881 B | 102400 B | yes | PASS |
| mountIsland | -184 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeFreshHandler

# Perf Report — invokeFreshHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0078ms |
| p50 | 0.0098ms |
| p95 | 0.04ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.04ms |
| min | 0.0073ms |
| max | 0.51ms |
| total | 3.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0078ms | 0.0081ms | -0.00033ms | -4.10% |
| p50 | 0.0098ms | 0.0095ms | +0.00029ms | +3.06% |
| p95 | 0.04ms | 0.03ms | +0.0086ms | +26.68% |
| p99 | 0.08ms | 0.08ms | -0.0031ms | -3.66% |
| mean | 0.02ms | 0.01ms | +0.0024ms | +17.63% |
| min | 0.0073ms | 0.0075ms | -0.00021ms | -2.79% |
| max | 0.51ms | 0.10ms | +0.41ms | +404.64% |
| total | 3.19ms | 2.71ms | +0.48ms | +17.63% |

### mountIsland

# Perf Report — mountIsland.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0014ms |
| p95 | 0.0028ms |
| p99 | 0.02ms |
| mean | 0.0018ms |
| stdev | 0.0023ms |
| min | 0.0013ms |
| max | 0.02ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0013ms | -0.000041ms | -3.08% |
| p50 | 0.0014ms | 0.0014ms | -0.000042ms | -2.96% |
| p95 | 0.0028ms | 0.01ms | -0.0074ms | -72.93% |
| p99 | 0.02ms | 0.03ms | -0.02ms | -53.00% |
| mean | 0.0018ms | 0.0029ms | -0.0012ms | -39.37% |
| min | 0.0013ms | 0.0013ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.06ms | -0.03ms | -59.69% |
| total | 0.36ms | 0.59ms | -0.23ms | -39.37% |

