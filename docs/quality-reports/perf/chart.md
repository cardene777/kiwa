# Perf Suite — chart

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderChart | 0.00054ms | 0.0038ms | 5ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |
| computeAxis | 0.00058ms | 0.0052ms | 5ms | 0.00032ms | PASS | stable (p10 +5% (閾値未満)、 p95 +135% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| captureLegend | 0.00038ms | 0.0089ms | 5ms | 0.00031ms | PASS | stable (p10 +6% (閾値未満)、 p95 +254% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| dispatchTooltip | 0.00045ms | 0.01ms | 5ms | 0.00032ms | PASS | stable (差 0.00011ms が下限 0.00032ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| renderChart | cpu | 0.08ms | 0.00054ms | 0.007 | 0.007 | 0.00053ms | 0.00054ms |
| computeAxis | cpu | 0.08ms | 0.00058ms | 0.007 | 0.007 | 0.00057ms | 0.00054ms |
| captureLegend | cpu | 0.09ms | 0.00038ms | 0.004 | 0.004 | 0.00035ms | 0.00033ms |
| dispatchTooltip | cpu | 0.08ms | 0.00045ms | 0.005 | 0.004 | 0.00044ms | 0.00033ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderChart | 0.02ms | 10ms | PASS |
| computeAxis | 0.01ms | 10ms | PASS |
| captureLegend | 0.01ms | 10ms | PASS |
| dispatchTooltip | 0.04ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderChart | 370064 B | 0 B | 102400 B | yes | PASS |
| computeAxis | -9576 B | 0 B | 102400 B | yes | PASS |
| captureLegend | 9208 B | 0 B | 102400 B | yes | PASS |
| dispatchTooltip | 744 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderChart

# Perf Report — renderChart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00075ms |
| p95 | 0.0038ms |
| p99 | 0.01ms |
| mean | 0.0014ms |
| stdev | 0.0020ms |
| min | 0.00050ms |
| max | 0.02ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| p50 | 0.00075ms | 0.00071ms | +0.000041ms | +5.78% |
| p95 | 0.0038ms | 0.0065ms | -0.0027ms | -41.68% |
| p99 | 0.01ms | 0.01ms | -0.0012ms | -9.67% |
| mean | 0.0014ms | 0.0014ms | -0.0000013ms | -0.09% |
| min | 0.00050ms | 0.00046ms | +0.000042ms | +9.17% |
| max | 0.02ms | 0.02ms | +0.0043ms | +28.10% |
| total | 0.28ms | 0.28ms | -0.00026ms | -0.09% |

### computeAxis

# Perf Report — computeAxis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00063ms |
| p95 | 0.0052ms |
| p99 | 0.01ms |
| mean | 0.0013ms |
| stdev | 0.0024ms |
| min | 0.00054ms |
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00054ms | +0.000041ms | +7.56% |
| p50 | 0.00063ms | 0.00058ms | +0.000042ms | +7.20% |
| p95 | 0.0052ms | 0.0022ms | +0.0031ms | +140.66% |
| p99 | 0.01ms | 0.01ms | -0.0030ms | -21.86% |
| mean | 0.0013ms | 0.0011ms | +0.00013ms | +11.08% |
| min | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.03ms | -0.0043ms | -15.77% |
| total | 0.25ms | 0.23ms | +0.03ms | +11.08% |

### captureLegend

# Perf Report — captureLegend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00075ms |
| p95 | 0.0089ms |
| p99 | 0.02ms |
| mean | 0.0022ms |
| stdev | 0.0051ms |
| min | 0.00033ms |
| max | 0.05ms |
| total | 0.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00033ms | +0.000042ms | +12.61% |
| p50 | 0.00075ms | 0.00063ms | +0.00013ms | +20.00% |
| p95 | 0.0089ms | 0.0024ms | +0.0066ms | +274.72% |
| p99 | 0.02ms | 0.01ms | +0.0044ms | +33.02% |
| mean | 0.0022ms | 0.0011ms | +0.0011ms | +101.58% |
| min | 0.00033ms | 0.00029ms | +0.000042ms | +14.43% |
| max | 0.05ms | 0.03ms | +0.03ms | +91.70% |
| total | 0.43ms | 0.21ms | +0.22ms | +101.58% |

### dispatchTooltip

# Perf Report — dispatchTooltip.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00045ms |
| p50 | 0.0013ms |
| p95 | 0.01ms |
| p99 | 0.04ms |
| mean | 0.0041ms |
| stdev | 0.0096ms |
| min | 0.00033ms |
| max | 0.10ms |
| total | 0.83ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00045ms | 0.00033ms | +0.00012ms | +36.31% |
| p50 | 0.0013ms | 0.00088ms | +0.00046ms | +52.40% |
| p95 | 0.01ms | 0.0085ms | +0.0062ms | +73.03% |
| p99 | 0.04ms | 0.02ms | +0.02ms | +140.27% |
| mean | 0.0041ms | 0.0016ms | +0.0025ms | +154.64% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.10ms | 0.03ms | +0.07ms | +239.54% |
| total | 0.83ms | 0.33ms | +0.50ms | +154.64% |

