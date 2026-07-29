# Perf Suite — rust-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeAxumHandler | 0.00042ms | 0.0030ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeActixHandler | 0.00046ms | 0.0019ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureTowerMiddleware | 0.00054ms | 0.0029ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeRocketRoute | 0.00050ms | 0.0027ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| invokeAxumHandler | cpu | 0.08ms | 0.00042ms | 0.005 | 0.006 | 0.00041ms | 0.00045ms |
| invokeActixHandler | cpu | 0.08ms | 0.00046ms | 0.006 | 0.006 | 0.00047ms | 0.00050ms |
| captureTowerMiddleware | cpu | 0.08ms | 0.00054ms | 0.007 | 0.007 | 0.00055ms | 0.00054ms |
| invokeRocketRoute | cpu | 0.08ms | 0.00050ms | 0.006 | 0.006 | 0.00051ms | 0.00050ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeAxumHandler | 0.01ms | 10ms | PASS |
| invokeActixHandler | 0.01ms | 10ms | PASS |
| captureTowerMiddleware | 0.01ms | 10ms | PASS |
| invokeRocketRoute | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeAxumHandler | -10528 B | 0 B | 102400 B | yes | PASS |
| invokeActixHandler | 3952 B | 0 B | 102400 B | yes | PASS |
| captureTowerMiddleware | 4624 B | 0 B | 102400 B | yes | PASS |
| invokeRocketRoute | -112 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeAxumHandler

# Perf Report — invokeAxumHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0030ms |
| p99 | 0.0094ms |
| mean | 0.0010ms |
| stdev | 0.0019ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00045ms | -0.000037ms | -8.13% |
| p50 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p95 | 0.0030ms | 0.0040ms | -0.0011ms | -26.81% |
| p99 | 0.0094ms | 0.01ms | -0.0014ms | -12.93% |
| mean | 0.0010ms | 0.0013ms | -0.00025ms | -19.84% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.02ms | 0.03ms | -0.0067ms | -25.48% |
| total | 0.20ms | 0.25ms | -0.05ms | -19.84% |

### invokeActixHandler

# Perf Report — invokeActixHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0019ms |
| p99 | 0.0053ms |
| mean | 0.00075ms |
| stdev | 0.0011ms |
| min | 0.00042ms |
| max | 0.01ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00050ms | -0.000038ms | -7.64% |
| p50 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p95 | 0.0019ms | 0.0026ms | -0.00062ms | -24.14% |
| p99 | 0.0053ms | 0.0069ms | -0.0016ms | -23.01% |
| mean | 0.00075ms | 0.00086ms | -0.00012ms | -13.38% |
| min | 0.00042ms | 0.00046ms | -0.000042ms | -9.17% |
| max | 0.01ms | 0.01ms | -0.0017ms | -13.65% |
| total | 0.15ms | 0.17ms | -0.02ms | -13.38% |

### captureTowerMiddleware

# Perf Report — captureTowerMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0029ms |
| p99 | 0.01ms |
| mean | 0.00098ms |
| stdev | 0.0018ms |
| min | 0.00054ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00054ms | +0.0000010ms | +0.18% |
| p50 | 0.00058ms | 0.00058ms | 0.00ms | 0.00% |
| p95 | 0.0029ms | 0.0042ms | -0.0013ms | -30.59% |
| p99 | 0.01ms | 0.01ms | +0.000052ms | +0.49% |
| mean | 0.00098ms | 0.0012ms | -0.00018ms | -15.57% |
| min | 0.00054ms | 0.00050ms | +0.000041ms | +8.20% |
| max | 0.02ms | 0.02ms | -0.0090ms | -36.88% |
| total | 0.20ms | 0.23ms | -0.04ms | -15.57% |

### invokeRocketRoute

# Perf Report — invokeRocketRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00050ms |
| p95 | 0.0027ms |
| p99 | 0.0091ms |
| mean | 0.00084ms |
| stdev | 0.0014ms |
| min | 0.00046ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00050ms | 0.00063ms | -0.00013ms | -20.00% |
| p95 | 0.0027ms | 0.0095ms | -0.0068ms | -71.83% |
| p99 | 0.0091ms | 0.02ms | -0.0072ms | -44.25% |
| mean | 0.00084ms | 0.0023ms | -0.0014ms | -63.04% |
| min | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.06ms | -0.05ms | -81.62% |
| total | 0.17ms | 0.45ms | -0.29ms | -63.04% |

