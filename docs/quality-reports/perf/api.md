# Perf Suite — api

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| requestClientGet | 0.01ms | 0.05ms | 5ms | 0.00034ms | PASS | stable (換算後 p10 +0% (閾値未満)、 p95 +26% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| requestClientPost | 0.0056ms | 0.04ms | 5ms | 0.00034ms | PASS | improved — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| requestClientGet | cpu | 0.10ms | 0.11ms | 0.01ms | 0.114 | 0.114 | n/a | 20.0% | 0.0092ms | 0.0092ms |
| requestClientPost | cpu | 0.10ms | 0.13ms | 0.0056ms | 0.057 | 0.088 | n/a | 20.0% | 0.0046ms | 0.0071ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| requestClientGet | 0.31ms | 10ms | PASS |
| requestClientPost | 0.35ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| requestClientGet | 22544 B | -20151 B | 102400 B | yes | 220 (20 + 200) | PASS |
| requestClientPost | -133216 B | -10051 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### requestClientGet

# Perf Report — requestClientGet.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.05ms |
| p99 | 0.12ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.19ms |
| total | 3.85ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.820)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0092ms | 0.0092ms | +0.000016ms | +0.18% |
| p50 | 0.01ms | 0.01ms | -0.00039ms | -3.61% |
| p95 | 0.04ms | 0.03ms | +0.0084ms | +25.99% |
| p99 | 0.10ms | 0.10ms | -0.0022ms | -2.18% |
| mean | 0.02ms | 0.02ms | +0.00052ms | +3.38% |
| min | 0.0087ms | 0.0085ms | +0.00029ms | +3.37% |
| max | 0.16ms | 0.15ms | +0.01ms | +7.16% |
| total | 3.16ms | 3.05ms | +0.10ms | +3.38% |

### requestClientPost

# Perf Report — requestClientPost.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0056ms |
| p50 | 0.0060ms |
| p95 | 0.04ms |
| p99 | 0.17ms |
| mean | 0.01ms |
| stdev | 0.05ms |
| min | 0.0055ms |
| max | 0.66ms |
| total | 2.98ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.823)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0046ms | 0.0071ms | -0.0025ms | -34.63% |
| p50 | 0.0049ms | 0.0078ms | -0.0029ms | -36.95% |
| p95 | 0.03ms | 0.02ms | +0.02ms | +84.72% |
| p99 | 0.14ms | 0.07ms | +0.07ms | +92.06% |
| mean | 0.01ms | 0.01ms | +0.0018ms | +16.76% |
| min | 0.0045ms | 0.0068ms | -0.0023ms | -33.85% |
| max | 0.54ms | 0.14ms | +0.40ms | +288.64% |
| total | 2.45ms | 2.10ms | +0.35ms | +16.76% |

