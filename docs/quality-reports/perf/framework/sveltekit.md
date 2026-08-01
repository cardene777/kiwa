# Perf Suite — sveltekit

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeLoad | 0.00067ms | 0.0090ms | 5ms | 0.00030ms | PASS | stable (換算後 p10 -4% (閾値未満)、 p95 +165% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeAction | 0.01ms | 0.21ms | 5ms | 0.00029ms | PASS | stable (換算後 p10 -3% (閾値未満)、 p95 +264% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| invokeLoad | cpu | 0.09ms | 0.11ms | 0.00067ms | 0.007 | 0.008 | n/a | 20.0% | 0.00060ms | 0.00063ms |
| invokeAction | cpu | 0.09ms | 0.25ms | 0.01ms | 0.131 | 0.135 | n/a | 20.0% | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoad | 0.02ms | 10ms | PASS |
| invokeAction | 0.97ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| invokeLoad | 10232 B | -32950 B | 102400 B | yes | 220 (20 + 200) | PASS |
| invokeAction | -82592 B | -41420 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### invokeLoad

# Perf Report — invokeLoad.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00081ms |
| p95 | 0.0090ms |
| p99 | 0.03ms |
| mean | 0.0026ms |
| stdev | 0.0097ms |
| min | 0.00063ms |
| max | 0.13ms |
| total | 0.52ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.900)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00060ms | 0.00063ms | -0.000025ms | -3.97% |
| p50 | 0.00073ms | 0.00075ms | -0.000019ms | -2.52% |
| p95 | 0.0081ms | 0.0031ms | +0.0051ms | +165.27% |
| p99 | 0.03ms | 0.0093ms | +0.02ms | +178.20% |
| mean | 0.0023ms | 0.0012ms | +0.0011ms | +93.86% |
| min | 0.00056ms | 0.00058ms | -0.000021ms | -3.53% |
| max | 0.11ms | 0.02ms | +0.09ms | +443.34% |
| total | 0.47ms | 0.24ms | +0.23ms | +93.86% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.21ms |
| p99 | 0.78ms |
| mean | 0.08ms |
| stdev | 0.39ms |
| min | 0.01ms |
| max | 4.10ms |
| total | 16.59ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.871)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00033ms | -2.96% |
| p50 | 0.01ms | 0.01ms | +0.000089ms | +0.73% |
| p95 | 0.18ms | 0.05ms | +0.13ms | +263.88% |
| p99 | 0.68ms | 0.09ms | +0.59ms | +630.17% |
| mean | 0.07ms | 0.02ms | +0.06ms | +319.13% |
| min | 0.01ms | 0.01ms | -0.00015ms | -1.41% |
| max | 3.58ms | 0.11ms | +3.46ms | +3101.27% |
| total | 14.45ms | 3.45ms | +11.00ms | +319.13% |

