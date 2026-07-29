# Perf Suite — dogfood-trace-flame-graph

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| loadTrace | 0.00029ms | 0.0041ms | 20ms | 0.00036ms | PASS | stable (検知には +0.00036ms (baseline 比 +109%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| renderFlame | 0.00050ms | 0.0035ms | 30ms | 0.00035ms | PASS | stable (p10 -4% (閾値未満)、 p95 +20% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| drillDown | 0.00050ms | 0.0030ms | 20ms | 0.00036ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| loadTrace | cpu | 0.08ms | 0.00029ms | 0.004 | 0.004 | 0.00032ms | 0.00033ms |
| renderFlame | cpu | 0.08ms | 0.00050ms | 0.006 | 0.006 | 0.00052ms | 0.00054ms |
| drillDown | cpu | 0.08ms | 0.00050ms | 0.006 | 0.006 | 0.00053ms | 0.00054ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| loadTrace | 0.01ms | 40ms | PASS |
| renderFlame | 0.01ms | 60ms | PASS |
| drillDown | 0.01ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| loadTrace | 391424 B | 0 B | 102400 B | yes | PASS |
| renderFlame | 18472 B | 0 B | 102400 B | yes | PASS |
| drillDown | 40576 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### loadTrace

# Perf Report — loadTrace.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00042ms |
| p95 | 0.0041ms |
| p99 | 0.0057ms |
| mean | 0.00088ms |
| stdev | 0.0013ms |
| min | 0.00025ms |
| max | 0.0058ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p50 | 0.00042ms | 0.00054ms | -0.00012ms | -23.06% |
| p95 | 0.0041ms | 0.0039ms | +0.00020ms | +5.12% |
| p99 | 0.0057ms | 0.02ms | -0.01ms | -63.69% |
| mean | 0.00088ms | 0.0015ms | -0.00066ms | -42.81% |
| min | 0.00025ms | 0.00029ms | -0.000042ms | -14.38% |
| max | 0.0058ms | 0.02ms | -0.02ms | -72.60% |
| total | 0.04ms | 0.06ms | -0.03ms | -42.81% |

### renderFlame

# Perf Report — renderFlame.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00056ms |
| p95 | 0.0035ms |
| p99 | 0.0065ms |
| mean | 0.0011ms |
| stdev | 0.0014ms |
| min | 0.00050ms |
| max | 0.0084ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00054ms | -0.000042ms | -7.73% |
| p50 | 0.00056ms | 0.00063ms | -0.000063ms | -10.00% |
| p95 | 0.0035ms | 0.0030ms | +0.00045ms | +14.90% |
| p99 | 0.0065ms | 0.0083ms | -0.0018ms | -21.91% |
| mean | 0.0011ms | 0.0011ms | -0.000049ms | -4.36% |
| min | 0.00050ms | 0.00054ms | -0.000041ms | -7.58% |
| max | 0.0084ms | 0.01ms | -0.0027ms | -24.15% |
| total | 0.04ms | 0.04ms | -0.0020ms | -4.36% |

### drillDown

# Perf Report — drillDown.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00050ms |
| p95 | 0.0030ms |
| p99 | 0.0050ms |
| mean | 0.00092ms |
| stdev | 0.0011ms |
| min | 0.00050ms |
| max | 0.0054ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00054ms | -0.000041ms | -7.58% |
| p50 | 0.00050ms | 0.00058ms | -0.000084ms | -14.38% |
| p95 | 0.0030ms | 0.0096ms | -0.0066ms | -69.16% |
| p99 | 0.0050ms | 0.01ms | -0.0061ms | -54.72% |
| mean | 0.00092ms | 0.0018ms | -0.00085ms | -47.94% |
| min | 0.00050ms | 0.00054ms | -0.000041ms | -7.58% |
| max | 0.0054ms | 0.01ms | -0.0067ms | -55.36% |
| total | 0.04ms | 0.07ms | -0.03ms | -47.94% |

