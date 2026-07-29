# Perf Suite — nextjs

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeServerAction | 0.00054ms | 0.0030ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeMiddleware | 0.0046ms | 0.01ms | 5ms | 0.00035ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderServerComponent | 0.00038ms | 0.0015ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| invokeServerAction | cpu | 0.08ms | 0.00054ms | 0.007 | 0.007 | 0.00054ms | 0.00058ms |
| invokeMiddleware | cpu | 0.08ms | 0.0046ms | 0.057 | 0.057 | 0.0048ms | 0.0047ms |
| renderServerComponent | cpu | 0.08ms | 0.00038ms | 0.005 | 0.005 | 0.00038ms | 0.00038ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerAction | 0.02ms | 10ms | PASS |
| invokeMiddleware | 0.07ms | 10ms | PASS |
| renderServerComponent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerAction | -15288 B | 0 B | 102400 B | yes | PASS |
| invokeMiddleware | -27184 B | 0 B | 102400 B | yes | PASS |
| renderServerComponent | 507248 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeServerAction

# Perf Report — invokeServerAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0030ms |
| p99 | 0.0090ms |
| mean | 0.0012ms |
| stdev | 0.0020ms |
| min | 0.00050ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00058ms | -0.000042ms | -7.20% |
| p50 | 0.00058ms | 0.00063ms | -0.000041ms | -6.56% |
| p95 | 0.0030ms | 0.0046ms | -0.0016ms | -34.93% |
| p99 | 0.0090ms | 0.02ms | -0.0074ms | -45.08% |
| mean | 0.0012ms | 0.0015ms | -0.00026ms | -17.82% |
| min | 0.00050ms | 0.00054ms | -0.000041ms | -7.58% |
| max | 0.02ms | 0.03ms | -0.0054ms | -20.09% |
| total | 0.24ms | 0.29ms | -0.05ms | -17.82% |

### invokeMiddleware

# Perf Report — invokeMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0046ms |
| p50 | 0.0047ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0060ms |
| stdev | 0.0056ms |
| min | 0.0044ms |
| max | 0.06ms |
| total | 1.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0046ms | 0.0047ms | -0.00017ms | -3.52% |
| p50 | 0.0047ms | 0.0053ms | -0.00050ms | -9.52% |
| p95 | 0.01ms | 0.04ms | -0.03ms | -69.94% |
| p99 | 0.03ms | 0.11ms | -0.08ms | -75.78% |
| mean | 0.0060ms | 0.01ms | -0.0048ms | -44.73% |
| min | 0.0044ms | 0.0046ms | -0.00017ms | -3.66% |
| max | 0.06ms | 0.16ms | -0.11ms | -64.72% |
| total | 1.20ms | 2.16ms | -0.97ms | -44.73% |

### renderServerComponent

# Perf Report — renderServerComponent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0015ms |
| p99 | 0.0066ms |
| mean | 0.00068ms |
| stdev | 0.0015ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p95 | 0.0015ms | 0.0030ms | -0.0016ms | -52.03% |
| p99 | 0.0066ms | 0.0066ms | +0.000047ms | +0.72% |
| mean | 0.00068ms | 0.00081ms | -0.00013ms | -16.03% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | -0.0017ms | -8.74% |
| total | 0.14ms | 0.16ms | -0.03ms | -16.03% |

