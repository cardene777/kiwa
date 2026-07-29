# Perf Suite — hono

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeRoute | 0.0018ms | 0.0065ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| rpcClient$get | 0.0027ms | 0.0075ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| invokeRoute | cpu | 0.08ms | 0.0018ms | 0.023 | 0.022 | 0.0018ms | 0.0018ms |
| rpcClient$get | cpu | 0.08ms | 0.0027ms | 0.033 | 0.033 | 0.0027ms | 0.0027ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRoute | 0.04ms | 10ms | PASS |
| rpcClient$get | 0.04ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRoute | -14928 B | 0 B | 102400 B | yes | PASS |
| rpcClient$get | 632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeRoute

# Perf Report — invokeRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0020ms |
| p95 | 0.0065ms |
| p99 | 0.02ms |
| mean | 0.0028ms |
| stdev | 0.0034ms |
| min | 0.0018ms |
| max | 0.03ms |
| total | 0.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0018ms | +0.000043ms | +2.40% |
| p50 | 0.0020ms | 0.0020ms | -0.000042ms | -2.10% |
| p95 | 0.0065ms | 0.0084ms | -0.0019ms | -22.85% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -36.07% |
| mean | 0.0028ms | 0.0036ms | -0.00075ms | -20.96% |
| min | 0.0018ms | 0.0017ms | +0.000083ms | +4.86% |
| max | 0.03ms | 0.07ms | -0.04ms | -57.54% |
| total | 0.56ms | 0.71ms | -0.15ms | -20.96% |

### rpcClient$get

# Perf Report — rpcClient$get.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0028ms |
| p95 | 0.0075ms |
| p99 | 0.01ms |
| mean | 0.0034ms |
| stdev | 0.0030ms |
| min | 0.0026ms |
| max | 0.04ms |
| total | 0.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0027ms | 0.00ms | 0.00% |
| p50 | 0.0028ms | 0.0028ms | -0.000042ms | -1.48% |
| p95 | 0.0075ms | 0.01ms | -0.0035ms | -31.94% |
| p99 | 0.01ms | 0.03ms | -0.01ms | -50.14% |
| mean | 0.0034ms | 0.0042ms | -0.00081ms | -19.17% |
| min | 0.0026ms | 0.0025ms | +0.000084ms | +3.31% |
| max | 0.04ms | 0.04ms | -0.0018ms | -4.43% |
| total | 0.69ms | 0.85ms | -0.16ms | -19.17% |

