# Perf Suite — edge

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeEdgeHandler | 0.0086ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeEdgeHandlerWithKv | 0.0064ms | 0.0080ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| invokeEdgeHandler | cpu | 0.08ms | 0.0086ms | 0.106 | 0.112 | 0.0086ms | 0.0092ms |
| invokeEdgeHandlerWithKv | cpu | 0.08ms | 0.0064ms | 0.079 | 0.084 | 0.0066ms | 0.0069ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEdgeHandler | 0.13ms | 10ms | PASS |
| invokeEdgeHandlerWithKv | 0.07ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeEdgeHandler | -99792 B | 0 B | 102400 B | yes | PASS |
| invokeEdgeHandlerWithKv | -656 B | -25 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeEdgeHandler

# Perf Report — invokeEdgeHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0086ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0077ms |
| max | 0.10ms |
| total | 2.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0086ms | 0.0092ms | -0.00060ms | -6.54% |
| p50 | 0.01ms | 0.01ms | -0.00073ms | -6.37% |
| p95 | 0.03ms | 0.08ms | -0.06ms | -67.19% |
| p99 | 0.07ms | 0.20ms | -0.13ms | -67.38% |
| mean | 0.01ms | 0.02ms | -0.0098ms | -41.71% |
| min | 0.0077ms | 0.0080ms | -0.00033ms | -4.18% |
| max | 0.10ms | 0.32ms | -0.22ms | -69.52% |
| total | 2.74ms | 4.70ms | -1.96ms | -41.71% |

### invokeEdgeHandlerWithKv

# Perf Report — invokeEdgeHandlerWithKv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0064ms |
| p50 | 0.0066ms |
| p95 | 0.0080ms |
| p99 | 0.01ms |
| mean | 0.0069ms |
| stdev | 0.0012ms |
| min | 0.0062ms |
| max | 0.02ms |
| total | 1.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0064ms | 0.0069ms | -0.00054ms | -7.78% |
| p50 | 0.0066ms | 0.0075ms | -0.00092ms | -12.21% |
| p95 | 0.0080ms | 0.06ms | -0.05ms | -86.82% |
| p99 | 0.01ms | 0.12ms | -0.11ms | -89.86% |
| mean | 0.0069ms | 0.02ms | -0.01ms | -61.79% |
| min | 0.0062ms | 0.0065ms | -0.00029ms | -4.52% |
| max | 0.02ms | 0.30ms | -0.28ms | -93.49% |
| total | 1.37ms | 3.59ms | -2.22ms | -61.79% |

