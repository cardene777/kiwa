# Perf Suite — fresh

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeFreshHandler | 0.0091ms | 0.02ms | 5ms | 0.00029ms | PASS | stable — gate 無効 (regressionGate=false) |
| mountIsland | 0.0015ms | 0.02ms | 5ms | 0.00029ms | PASS | stable (換算後 p10 +3% (閾値未満)、 p95 +270% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| invokeFreshHandler | cpu | 0.09ms | 0.10ms | 0.0091ms | 0.097 | 0.096 | n/a | 20.0% | 0.0080ms | 0.0080ms |
| mountIsland | cpu | 0.09ms | 0.13ms | 0.0015ms | 0.016 | 0.016 | n/a | 20.0% | 0.0013ms | 0.0013ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeFreshHandler | 1.07ms | 10ms | PASS |
| mountIsland | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| invokeFreshHandler | -114216 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| mountIsland | 13064 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### invokeFreshHandler

# Perf Report — invokeFreshHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0091ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0087ms |
| max | 0.11ms |
| total | 2.65ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.881)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0080ms | 0.0080ms | +0.000081ms | +1.02% |
| p50 | 0.0095ms | 0.01ms | -0.00058ms | -5.74% |
| p95 | 0.02ms | 0.05ms | -0.03ms | -55.98% |
| p99 | 0.05ms | 0.13ms | -0.08ms | -61.54% |
| mean | 0.01ms | 0.02ms | -0.0090ms | -43.45% |
| min | 0.0076ms | 0.0076ms | +0.000049ms | +0.64% |
| max | 0.10ms | 1.01ms | -0.91ms | -90.19% |
| total | 2.34ms | 4.13ms | -1.80ms | -43.45% |

### mountIsland

# Perf Report — mountIsland.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0015ms |
| p50 | 0.0017ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.0054ms |
| stdev | 0.01ms |
| min | 0.0015ms |
| max | 0.11ms |
| total | 1.07ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.866)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0013ms | +0.000044ms | +3.40% |
| p50 | 0.0014ms | 0.0013ms | +0.00011ms | +8.29% |
| p95 | 0.02ms | 0.0049ms | +0.01ms | +269.55% |
| p99 | 0.05ms | 0.03ms | +0.02ms | +78.95% |
| mean | 0.0046ms | 0.0026ms | +0.0021ms | +81.21% |
| min | 0.0013ms | 0.0012ms | +0.000054ms | +4.47% |
| max | 0.10ms | 0.10ms | +0.0014ms | +1.42% |
| total | 0.93ms | 0.51ms | +0.42ms | +81.21% |

