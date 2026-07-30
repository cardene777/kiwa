# Perf Suite — solidjs

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderSolid | 0.00054ms | 0.0030ms | 5ms | 0.00030ms | PASS | stable (換算後 p10 -9% (閾値未満)、 p95 +34% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| mockSignalEffect | 0.0010ms | 0.02ms | 5ms | 0.00030ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +229% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| renderSolid | cpu | 0.09ms | 0.10ms | 0.00054ms | 0.006 | 0.007 | 0.00049ms | 0.00054ms |
| mockSignalEffect | cpu | 0.09ms | 0.13ms | 0.0010ms | 0.012 | 0.011 | 0.00094ms | 0.00092ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderSolid | 0.02ms | 10ms | PASS |
| mockSignalEffect | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderSolid | 6856 B | -31528 B | 102400 B | yes | PASS |
| mockSignalEffect | -88 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderSolid

# Perf Report — renderSolid.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00063ms |
| p95 | 0.0030ms |
| p99 | 0.01ms |
| mean | 0.0011ms |
| stdev | 0.0021ms |
| min | 0.00054ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.906)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00049ms | 0.00054ms | -0.000051ms | -9.39% |
| p50 | 0.00057ms | 0.00058ms | -0.000017ms | -2.86% |
| p95 | 0.0027ms | 0.0020ms | +0.00068ms | +33.87% |
| p99 | 0.0098ms | 0.0095ms | +0.00031ms | +3.30% |
| mean | 0.0010ms | 0.00092ms | +0.000096ms | +10.42% |
| min | 0.00049ms | 0.00050ms | -0.0000098ms | -1.96% |
| max | 0.02ms | 0.02ms | +0.0011ms | +6.55% |
| total | 0.20ms | 0.18ms | +0.02ms | +10.42% |

### mockSignalEffect

# Perf Report — mockSignalEffect.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0012ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0035ms |
| stdev | 0.0097ms |
| min | 0.00096ms |
| max | 0.12ms |
| total | 0.71ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.898)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00094ms | 0.00092ms | +0.000019ms | +2.07% |
| p50 | 0.0010ms | 0.00096ms | +0.000089ms | +9.31% |
| p95 | 0.02ms | 0.0047ms | +0.01ms | +228.86% |
| p99 | 0.03ms | 0.01ms | +0.02ms | +139.51% |
| mean | 0.0032ms | 0.0016ms | +0.0016ms | +104.75% |
| min | 0.00086ms | 0.00088ms | -0.000014ms | -1.65% |
| max | 0.11ms | 0.02ms | +0.08ms | +388.08% |
| total | 0.64ms | 0.31ms | +0.33ms | +104.75% |

