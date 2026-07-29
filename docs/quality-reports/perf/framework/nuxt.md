# Perf Suite — nuxt

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeEventHandler | 0.00092ms | 0.0026ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeRouteMiddleware | 0.00054ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| invokeEventHandler | cpu | 0.08ms | 0.00092ms | 0.011 | 0.011 | 0.00090ms | 0.00088ms |
| invokeRouteMiddleware | cpu | 0.08ms | 0.00054ms | 0.007 | 0.006 | 0.00053ms | 0.00050ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEventHandler | 0.03ms | 10ms | PASS |
| invokeRouteMiddleware | 0.01ms | 10ms | PASS |

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
| p50 | 0.0010ms |
| p95 | 0.0026ms |
| p99 | 0.01ms |
| mean | 0.0014ms |
| stdev | 0.0020ms |
| min | 0.00088ms |
| max | 0.02ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00092ms | 0.00088ms | +0.000041ms | +4.69% |
| p50 | 0.0010ms | 0.00096ms | +0.000041ms | +4.28% |
| p95 | 0.0026ms | 0.0029ms | -0.00033ms | -11.49% |
| p99 | 0.01ms | 0.01ms | +0.0013ms | +10.57% |
| mean | 0.0014ms | 0.0014ms | +0.000042ms | +3.02% |
| min | 0.00088ms | 0.00079ms | +0.000084ms | +10.62% |
| max | 0.02ms | 0.02ms | -0.0025ms | -12.89% |
| total | 0.29ms | 0.28ms | +0.0084ms | +3.02% |

### invokeRouteMiddleware

# Perf Report — invokeRouteMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00054ms |
| p95 | 0.0013ms |
| p99 | 0.0051ms |
| mean | 0.00072ms |
| stdev | 0.00078ms |
| min | 0.00050ms |
| max | 0.0065ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00050ms | +0.000041ms | +8.20% |
| p50 | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| p95 | 0.0013ms | 0.0029ms | -0.0016ms | -56.42% |
| p99 | 0.0051ms | 0.0071ms | -0.0020ms | -28.43% |
| mean | 0.00072ms | 0.00092ms | -0.00020ms | -21.51% |
| min | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| max | 0.0065ms | 0.01ms | -0.0067ms | -50.95% |
| total | 0.14ms | 0.18ms | -0.04ms | -21.51% |

