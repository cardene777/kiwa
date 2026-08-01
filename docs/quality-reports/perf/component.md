# Perf Suite — component

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00054ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0011ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| buildButtonDriveCanvas | 0.00042ms | 0.01ms | 5ms | 0.00096ms | PASS | stable (検知には +0.00096ms (baseline 比 +211%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| buildFormDriveCanvas | 0.0058ms | 0.02ms | 10ms | 0.00090ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderAndHashMarkup | 0.0031ms | 0.03ms | 5ms | 0.0011ms | PASS | stable (換算後 p10 -5% (閾値未満)、 p95 +87% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| buildButtonDriveCanvas | cpu | 0.09ms | 0.10ms | 0.00042ms | 0.004 | 0.005 | n/a | 20.0% | 0.00037ms | 0.00045ms |
| buildFormDriveCanvas | cpu | 0.10ms | 0.10ms | 0.0058ms | 0.059 | 0.057 | n/a | 20.0% | 0.0049ms | 0.0047ms |
| renderAndHashMarkup | cpu | 0.09ms | 0.11ms | 0.0031ms | 0.033 | 0.035 | n/a | 20.0% | 0.0031ms | 0.0033ms |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildButtonDriveCanvas | 0.01ms | 10ms | PASS |
| buildFormDriveCanvas | 0.23ms | 20ms | PASS |
| renderAndHashMarkup | 0.23ms | 10ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| buildButtonDriveCanvas | -22416 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |
| buildFormDriveCanvas | 17152 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |
| renderAndHashMarkup | 1336 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |

## Detailed serial reports

### buildButtonDriveCanvas

# Perf Report — buildButtonDriveCanvas.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.00042ms |
| p50 | 0.00063ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0024ms |
| stdev | 0.0040ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.07ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.892)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00037ms | 0.00045ms | -0.000082ms | -18.11% |
| p50 | 0.00056ms | 0.00063ms | -0.000068ms | -10.85% |
| p95 | 0.01ms | 0.0062ms | +0.0050ms | +80.31% |
| p99 | 0.01ms | 0.01ms | +0.0024ms | +20.86% |
| mean | 0.0022ms | 0.0018ms | +0.00037ms | +20.39% |
| min | 0.00033ms | 0.00038ms | -0.000041ms | -10.85% |
| max | 0.01ms | 0.01ms | +0.0015ms | +11.30% |
| total | 0.07ms | 0.05ms | +0.01ms | +20.39% |

### buildFormDriveCanvas

# Perf Report — buildFormDriveCanvas.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.0058ms |
| p50 | 0.0073ms |
| p95 | 0.02ms |
| p99 | 0.08ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0048ms |
| max | 0.10ms |
| total | 0.37ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.833)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0049ms | 0.0047ms | +0.00016ms | +3.43% |
| p50 | 0.0061ms | 0.01ms | -0.0044ms | -41.88% |
| p95 | 0.02ms | 0.07ms | -0.05ms | -75.20% |
| p99 | 0.07ms | 0.25ms | -0.18ms | -73.46% |
| mean | 0.01ms | 0.03ms | -0.02ms | -60.77% |
| min | 0.0040ms | 0.0042ms | -0.00018ms | -4.37% |
| max | 0.08ms | 0.30ms | -0.22ms | -72.27% |
| total | 0.31ms | 0.79ms | -0.48ms | -60.77% |

### renderAndHashMarkup

# Perf Report — renderAndHashMarkup.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.0031ms |
| p50 | 0.0050ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.0092ms |
| stdev | 0.01ms |
| min | 0.0030ms |
| max | 0.05ms |
| total | 0.28ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.998)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0031ms | 0.0033ms | -0.00018ms | -5.50% |
| p50 | 0.0050ms | 0.0040ms | +0.0010ms | +26.08% |
| p95 | 0.03ms | 0.01ms | +0.01ms | +87.13% |
| p99 | 0.05ms | 0.02ms | +0.03ms | +138.30% |
| mean | 0.0092ms | 0.0058ms | +0.0033ms | +57.66% |
| min | 0.0030ms | 0.0032ms | -0.00026ms | -7.86% |
| max | 0.05ms | 0.02ms | +0.03ms | +164.48% |
| total | 0.27ms | 0.17ms | +0.10ms | +57.66% |

