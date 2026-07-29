# Perf Suite — design-check

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| checkSpecConformance | 0.0021ms | 0.0057ms | 5ms | 0.00035ms | PASS | stable — gate 無効 (regressionGate=false) |
| checkLayoutRegression | 0.0059ms | 0.03ms | 5ms | 0.00035ms | PASS | stable (p10 -2% (閾値未満)、 p95 +24% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| checkSpecConformance | cpu | 0.08ms | 0.0021ms | 0.025 | 0.025 | 0.0022ms | 0.0021ms |
| checkLayoutRegression | cpu | 0.08ms | 0.0059ms | 0.074 | 0.075 | 0.0061ms | 0.0063ms |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| checkSpecConformance | 0.01ms | 10ms | PASS |
| checkLayoutRegression | 0.03ms | 10ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| checkSpecConformance | -53088 B | 0 B | 102400 B | yes | PASS |
| checkLayoutRegression | -1864 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### checkSpecConformance

# Perf Report — checkSpecConformance.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 5 |
| p10 | 0.0021ms |
| p50 | 0.0026ms |
| p95 | 0.0057ms |
| p99 | 0.0066ms |
| mean | 0.0029ms |
| stdev | 0.0012ms |
| min | 0.0020ms |
| max | 0.0072ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0021ms | -0.000046ms | -2.17% |
| p50 | 0.0026ms | 0.0025ms | +0.000063ms | +2.52% |
| p95 | 0.0057ms | 0.01ms | -0.0074ms | -56.36% |
| p99 | 0.0066ms | 0.03ms | -0.03ms | -81.11% |
| mean | 0.0029ms | 0.0048ms | -0.0018ms | -38.24% |
| min | 0.0020ms | 0.0021ms | -0.000083ms | -3.98% |
| max | 0.0072ms | 0.05ms | -0.04ms | -84.81% |
| total | 0.15ms | 0.24ms | -0.09ms | -38.24% |

### checkLayoutRegression

# Perf Report — checkLayoutRegression.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 5 |
| p10 | 0.0059ms |
| p50 | 0.0067ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.0086ms |
| min | 0.0058ms |
| max | 0.04ms |
| total | 0.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0063ms | -0.00038ms | -6.07% |
| p50 | 0.0067ms | 0.0066ms | +0.00015ms | +2.22% |
| p95 | 0.03ms | 0.02ms | +0.0046ms | +19.58% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +48.32% |
| mean | 0.01ms | 0.0094ms | +0.00097ms | +10.33% |
| min | 0.0058ms | 0.0062ms | -0.00038ms | -6.04% |
| max | 0.04ms | 0.03ms | +0.01ms | +45.38% |
| total | 0.52ms | 0.47ms | +0.05ms | +10.33% |

