# Perf Suite — expo

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createExpoTestEnv | 0.00083ms | 0.0036ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| routerPushCycle | 0.00050ms | 0.0060ms | 5ms | 0.00032ms | PASS | stable (p10 -2% (閾値未満)、 p95 +220% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| notificationDispatch | 0.00042ms | 0.0013ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| createExpoTestEnv | cpu | 0.08ms | 0.00083ms | 0.010 | 0.010 | 0.00082ms | 0.00083ms |
| routerPushCycle | cpu | 0.08ms | 0.00050ms | 0.006 | 0.006 | 0.00049ms | 0.00050ms |
| notificationDispatch | cpu | 0.08ms | 0.00042ms | 0.005 | 0.006 | 0.00043ms | 0.00046ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createExpoTestEnv | 0.04ms | 10ms | PASS |
| routerPushCycle | 0.02ms | 10ms | PASS |
| notificationDispatch | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createExpoTestEnv | -6472 B | 0 B | 102400 B | yes | PASS |
| routerPushCycle | 648 B | 0 B | 102400 B | yes | PASS |
| notificationDispatch | -15464 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createExpoTestEnv

# Perf Report — createExpoTestEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.00088ms |
| p95 | 0.0036ms |
| p99 | 0.02ms |
| mean | 0.0015ms |
| stdev | 0.0028ms |
| min | 0.00079ms |
| max | 0.03ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00083ms | 0.00083ms | 0.00ms | 0.00% |
| p50 | 0.00088ms | 0.00092ms | -0.000042ms | -4.58% |
| p95 | 0.0036ms | 0.0038ms | -0.00020ms | -5.30% |
| p99 | 0.02ms | 0.01ms | +0.0031ms | +24.15% |
| mean | 0.0015ms | 0.0017ms | -0.00024ms | -14.04% |
| min | 0.00079ms | 0.00079ms | +0.0000010ms | +0.13% |
| max | 0.03ms | 0.03ms | -0.0018ms | -6.02% |
| total | 0.30ms | 0.35ms | -0.05ms | -14.04% |

### routerPushCycle

# Perf Report — routerPushCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00056ms |
| p95 | 0.0060ms |
| p99 | 0.02ms |
| mean | 0.0014ms |
| stdev | 0.0029ms |
| min | 0.00050ms |
| max | 0.02ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00056ms | 0.00054ms | +0.000021ms | +3.97% |
| p95 | 0.0060ms | 0.0018ms | +0.0042ms | +227.85% |
| p99 | 0.02ms | 0.01ms | +0.0070ms | +58.80% |
| mean | 0.0014ms | 0.00090ms | +0.00047ms | +52.22% |
| min | 0.00050ms | 0.00046ms | +0.000042ms | +9.17% |
| max | 0.02ms | 0.02ms | +0.0062ms | +38.07% |
| total | 0.27ms | 0.18ms | +0.09ms | +52.22% |

### notificationDispatch

# Perf Report — notificationDispatch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.0013ms |
| p99 | 0.0064ms |
| mean | 0.00073ms |
| stdev | 0.0017ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000042ms | -9.17% |
| p50 | 0.00042ms | 0.00050ms | -0.000083ms | -16.60% |
| p95 | 0.0013ms | 0.0017ms | -0.00041ms | -24.72% |
| p99 | 0.0064ms | 0.0085ms | -0.0020ms | -24.09% |
| mean | 0.00073ms | 0.00092ms | -0.00020ms | -21.56% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.02ms | 0.03ms | -0.0097ms | -33.82% |
| total | 0.15ms | 0.18ms | -0.04ms | -21.56% |

