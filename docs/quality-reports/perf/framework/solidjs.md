# Perf Suite — solidjs

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderSolid | 0.00058ms | 0.0066ms | 5ms | 0.00033ms | PASS | stable (p10 +7% (閾値未満)、 p95 +42% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| mockSignalEffect | 0.00088ms | 0.0057ms | 5ms | 0.00033ms | PASS | stable (p10 -5% (閾値未満)、 p95 +84% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| renderSolid | cpu | 0.08ms | 0.00058ms | 0.007 | 0.007 | 0.00058ms | 0.00054ms |
| mockSignalEffect | cpu | 0.08ms | 0.00088ms | 0.011 | 0.011 | 0.00088ms | 0.00092ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderSolid | 0.01ms | 10ms | PASS |
| mockSignalEffect | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderSolid | -480 B | 0 B | 102400 B | yes | PASS |
| mockSignalEffect | -488 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderSolid

# Perf Report — renderSolid.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00063ms |
| p95 | 0.0066ms |
| p99 | 0.02ms |
| mean | 0.0017ms |
| stdev | 0.0039ms |
| min | 0.00054ms |
| max | 0.04ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00054ms | +0.000042ms | +7.76% |
| p50 | 0.00063ms | 0.00058ms | +0.000042ms | +7.20% |
| p95 | 0.0066ms | 0.0046ms | +0.0020ms | +43.17% |
| p99 | 0.02ms | 0.01ms | +0.0045ms | +30.40% |
| mean | 0.0017ms | 0.0014ms | +0.00031ms | +22.47% |
| min | 0.00054ms | 0.00050ms | +0.000041ms | +8.20% |
| max | 0.04ms | 0.03ms | +0.0074ms | +25.76% |
| total | 0.34ms | 0.27ms | +0.06ms | +22.47% |

### mockSignalEffect

# Perf Report — mockSignalEffect.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.00096ms |
| p95 | 0.0057ms |
| p99 | 0.03ms |
| mean | 0.0021ms |
| stdev | 0.0050ms |
| min | 0.00083ms |
| max | 0.04ms |
| total | 0.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00092ms | -0.000042ms | -4.58% |
| p50 | 0.00096ms | 0.0010ms | -0.000041ms | -4.10% |
| p95 | 0.0057ms | 0.0031ms | +0.0026ms | +83.91% |
| p99 | 0.03ms | 0.02ms | +0.0085ms | +36.63% |
| mean | 0.0021ms | 0.0017ms | +0.00043ms | +24.67% |
| min | 0.00083ms | 0.00088ms | -0.000041ms | -4.69% |
| max | 0.04ms | 0.03ms | +0.01ms | +52.22% |
| total | 0.43ms | 0.34ms | +0.09ms | +24.67% |

