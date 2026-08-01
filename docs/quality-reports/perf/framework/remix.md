# Perf Suite — remix

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeLoader | 0.0035ms | 0.03ms | 5ms | 0.00030ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +62% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeAction | 0.0031ms | 0.0049ms | 5ms | 0.00029ms | PASS | regressed — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| invokeLoader | cpu | 0.09ms | 0.12ms | 0.0035ms | 0.040 | 0.039 | n/a | 20.0% | 0.0032ms | 0.0031ms |
| invokeAction | cpu | 0.09ms | 0.09ms | 0.0031ms | 0.034 | 0.019 | n/a | 20.0% | 0.0028ms | 0.0016ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoader | 0.06ms | 10ms | PASS |
| invokeAction | 0.04ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| invokeLoader | 2208 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| invokeAction | 488 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### invokeLoader

# Perf Report — invokeLoader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0035ms |
| p50 | 0.0041ms |
| p95 | 0.03ms |
| p99 | 0.09ms |
| mean | 0.0092ms |
| stdev | 0.02ms |
| min | 0.0033ms |
| max | 0.17ms |
| total | 1.84ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.903)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0032ms | 0.0031ms | +0.000072ms | +2.30% |
| p50 | 0.0037ms | 0.0038ms | -0.000050ms | -1.32% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +62.46% |
| p99 | 0.08ms | 0.04ms | +0.05ms | +125.90% |
| mean | 0.0083ms | 0.0057ms | +0.0026ms | +46.31% |
| min | 0.0030ms | 0.0029ms | +0.000095ms | +3.32% |
| max | 0.15ms | 0.05ms | +0.10ms | +207.82% |
| total | 1.66ms | 1.14ms | +0.53ms | +46.31% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0031ms |
| p50 | 0.0033ms |
| p95 | 0.0049ms |
| p99 | 0.0085ms |
| mean | 0.0037ms |
| stdev | 0.0022ms |
| min | 0.0030ms |
| max | 0.03ms |
| total | 0.74ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.884)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0028ms | 0.0016ms | +0.0012ms | +74.46% |
| p50 | 0.0029ms | 0.0018ms | +0.0011ms | +65.16% |
| p95 | 0.0043ms | 0.0060ms | -0.0017ms | -28.63% |
| p99 | 0.0075ms | 0.03ms | -0.03ms | -77.29% |
| mean | 0.0033ms | 0.0033ms | -0.000035ms | -1.06% |
| min | 0.0027ms | 0.0015ms | +0.0012ms | +79.23% |
| max | 0.03ms | 0.06ms | -0.03ms | -53.83% |
| total | 0.65ms | 0.66ms | -0.0070ms | -1.06% |

