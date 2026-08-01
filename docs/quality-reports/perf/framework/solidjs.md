# Perf Suite — solidjs

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderSolid | 0.00067ms | 0.0068ms | 5ms | 0.00072ms | PASS | stable (検知には +0.00072ms (baseline 比 +132%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| mockSignalEffect | 0.0010ms | 0.0025ms | 5ms | 0.00071ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| renderSolid | cpu | 0.09ms | 0.13ms | 0.00067ms | 0.007 | 0.007 | n/a | 20.0% | 0.00057ms | 0.00054ms |
| mockSignalEffect | cpu | 0.09ms | 0.10ms | 0.0010ms | 0.011 | 0.011 | n/a | 20.0% | 0.00085ms | 0.00092ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderSolid | 0.02ms | 10ms | PASS |
| mockSignalEffect | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| renderSolid | -5712 B | -30998 B | 102400 B | yes | 220 (20 + 200) | PASS |
| mockSignalEffect | -232 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### renderSolid

# Perf Report — renderSolid.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00071ms |
| p95 | 0.0068ms |
| p99 | 0.02ms |
| mean | 0.0022ms |
| stdev | 0.0077ms |
| min | 0.00063ms |
| max | 0.10ms |
| total | 0.44ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.858)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00057ms | 0.00054ms | +0.000029ms | +5.40% |
| p50 | 0.00061ms | 0.00058ms | +0.000024ms | +4.17% |
| p95 | 0.0059ms | 0.0020ms | +0.0038ms | +191.24% |
| p99 | 0.01ms | 0.0095ms | +0.0040ms | +41.91% |
| mean | 0.0019ms | 0.00092ms | +0.00096ms | +103.91% |
| min | 0.00054ms | 0.00050ms | +0.000036ms | +7.22% |
| max | 0.09ms | 0.02ms | +0.07ms | +438.60% |
| total | 0.38ms | 0.18ms | +0.19ms | +103.91% |

### mockSignalEffect

# Perf Report — mockSignalEffect.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0012ms |
| p95 | 0.0025ms |
| p99 | 0.0083ms |
| mean | 0.0014ms |
| stdev | 0.0016ms |
| min | 0.00096ms |
| max | 0.02ms |
| total | 0.29ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.853)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00085ms | 0.00092ms | -0.000064ms | -6.99% |
| p50 | 0.00099ms | 0.00096ms | +0.000035ms | +3.70% |
| p95 | 0.0021ms | 0.0047ms | -0.0025ms | -54.23% |
| p99 | 0.0071ms | 0.01ms | -0.0047ms | -39.84% |
| mean | 0.0012ms | 0.0016ms | -0.00033ms | -21.37% |
| min | 0.00082ms | 0.00088ms | -0.000058ms | -6.62% |
| max | 0.01ms | 0.02ms | -0.0068ms | -31.31% |
| total | 0.24ms | 0.31ms | -0.07ms | -21.37% |

