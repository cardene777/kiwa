# Perf Suite — hono

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeRoute | 0.0018ms | 0.0056ms | 5ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |
| rpcClient$get | 0.0026ms | 0.0061ms | 5ms | 0.00033ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +45% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| invokeRoute | cpu | 0.08ms | 0.09ms | 0.0018ms | 0.022 | 0.022 | 0.0018ms | 0.0018ms |
| rpcClient$get | cpu | 0.08ms | 0.09ms | 0.0026ms | 0.032 | 0.032 | 0.0026ms | 0.0026ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRoute | 0.04ms | 10ms | PASS |
| rpcClient$get | 0.06ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRoute | -21576 B | 0 B | 102400 B | yes | PASS |
| rpcClient$get | -1176 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeRoute

# Perf Report — invokeRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0021ms |
| p95 | 0.0056ms |
| p99 | 0.01ms |
| mean | 0.0030ms |
| stdev | 0.0028ms |
| min | 0.0017ms |
| max | 0.03ms |
| total | 0.61ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.958)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0018ms | +0.0000060ms | +0.34% |
| p50 | 0.0020ms | 0.0020ms | +0.000078ms | +3.97% |
| p95 | 0.0054ms | 0.0068ms | -0.0014ms | -20.52% |
| p99 | 0.01ms | 0.02ms | -0.0043ms | -23.69% |
| mean | 0.0029ms | 0.0031ms | -0.00019ms | -6.07% |
| min | 0.0016ms | 0.0017ms | -0.000071ms | -4.14% |
| max | 0.03ms | 0.03ms | -0.0050ms | -15.98% |
| total | 0.58ms | 0.62ms | -0.04ms | -6.07% |

### rpcClient$get

# Perf Report — rpcClient$get.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0026ms |
| p50 | 0.0027ms |
| p95 | 0.0061ms |
| p99 | 0.02ms |
| mean | 0.0036ms |
| stdev | 0.0042ms |
| min | 0.0025ms |
| max | 0.05ms |
| total | 0.71ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.993)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0026ms | -0.000020ms | -0.76% |
| p50 | 0.0027ms | 0.0028ms | -0.00014ms | -5.06% |
| p95 | 0.0060ms | 0.0042ms | +0.0019ms | +44.84% |
| p99 | 0.02ms | 0.0095ms | +0.0095ms | +99.51% |
| mean | 0.0035ms | 0.0032ms | +0.00032ms | +9.97% |
| min | 0.0025ms | 0.0025ms | -0.000018ms | -0.72% |
| max | 0.05ms | 0.04ms | +0.0090ms | +21.72% |
| total | 0.71ms | 0.64ms | +0.06ms | +9.97% |

