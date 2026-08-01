# Perf Suite — qwikcity

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeRouteLoader | 0.00083ms | 0.0071ms | 5ms | 0.00030ms | PASS | stable (換算後 p10 +7% (閾値未満)、 p95 +170% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeRouteAction | 0.00075ms | 0.0024ms | 5ms | 0.00029ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| invokeRouteLoader | cpu | 0.09ms | 0.11ms | 0.00083ms | 0.009 | 0.009 | n/a | 20.0% | 0.00075ms | 0.00071ms |
| invokeRouteAction | cpu | 0.09ms | 0.09ms | 0.00075ms | 0.008 | 0.008 | n/a | 20.0% | 0.00065ms | 0.00067ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRouteLoader | 0.02ms | 10ms | PASS |
| invokeRouteAction | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| invokeRouteLoader | -16696 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| invokeRouteAction | -328 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### invokeRouteLoader

# Perf Report — invokeRouteLoader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.00096ms |
| p95 | 0.0071ms |
| p99 | 0.03ms |
| mean | 0.0022ms |
| stdev | 0.0048ms |
| min | 0.00079ms |
| max | 0.04ms |
| total | 0.45ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.905)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00075ms | 0.00071ms | +0.000046ms | +6.55% |
| p50 | 0.00087ms | 0.00079ms | +0.000075ms | +9.41% |
| p95 | 0.0064ms | 0.0024ms | +0.0040ms | +169.70% |
| p99 | 0.02ms | 0.0092ms | +0.02ms | +169.49% |
| mean | 0.0020ms | 0.0011ms | +0.00089ms | +78.45% |
| min | 0.00072ms | 0.00067ms | +0.000049ms | +7.43% |
| max | 0.04ms | 0.01ms | +0.02ms | +150.21% |
| total | 0.41ms | 0.23ms | +0.18ms | +78.45% |

### invokeRouteAction

# Perf Report — invokeRouteAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00075ms |
| p50 | 0.00079ms |
| p95 | 0.0024ms |
| p99 | 0.01ms |
| mean | 0.0012ms |
| stdev | 0.0020ms |
| min | 0.00071ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.867)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00065ms | 0.00067ms | -0.000016ms | -2.33% |
| p50 | 0.00069ms | 0.00071ms | -0.000022ms | -3.12% |
| p95 | 0.0021ms | 0.0036ms | -0.0015ms | -42.36% |
| p99 | 0.01ms | 0.01ms | -0.0036ms | -24.76% |
| mean | 0.0011ms | 0.0013ms | -0.00024ms | -18.19% |
| min | 0.00061ms | 0.00063ms | -0.000011ms | -1.75% |
| max | 0.02ms | 0.03ms | -0.01ms | -41.07% |
| total | 0.21ms | 0.26ms | -0.05ms | -18.19% |

