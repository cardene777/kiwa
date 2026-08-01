# Perf Suite — solidstart

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeServerFunction | 0.00046ms | 0.0059ms | 5ms | 0.00071ms | PASS | stable (検知には +0.00071ms (baseline 比 +189%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| invokeApiRoute | 0.01ms | 0.03ms | 5ms | 0.00074ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| invokeServerFunction | cpu | 0.09ms | 0.12ms | 0.00046ms | 0.005 | 0.005 | n/a | 20.0% | 0.00039ms | 0.00038ms |
| invokeApiRoute | cpu | 0.09ms | 0.10ms | 0.01ms | 0.114 | 0.123 | n/a | 20.0% | 0.0094ms | 0.01ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerFunction | 0.02ms | 10ms | PASS |
| invokeApiRoute | 0.13ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| invokeServerFunction | -14744 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| invokeApiRoute | 70752 B | -1507 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### invokeServerFunction

# Perf Report — invokeServerFunction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0059ms |
| p99 | 0.02ms |
| mean | 0.0013ms |
| stdev | 0.0038ms |
| min | 0.00046ms |
| max | 0.04ms |
| total | 0.26ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.850)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00039ms | 0.00038ms | +0.000014ms | +3.82% |
| p50 | 0.00043ms | 0.00042ms | +0.0000080ms | +1.93% |
| p95 | 0.0050ms | 0.0036ms | +0.0014ms | +37.73% |
| p99 | 0.01ms | 0.01ms | -0.00032ms | -2.44% |
| mean | 0.0011ms | 0.00093ms | +0.00018ms | +19.02% |
| min | 0.00039ms | 0.00038ms | +0.000014ms | +3.82% |
| max | 0.03ms | 0.01ms | +0.02ms | +126.26% |
| total | 0.22ms | 0.19ms | +0.04ms | +19.02% |

### invokeApiRoute

# Perf Report — invokeApiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.12ms |
| total | 2.99ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.887)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0094ms | 0.01ms | -0.00077ms | -7.64% |
| p50 | 0.01ms | 0.01ms | -0.0011ms | -10.00% |
| p95 | 0.02ms | 0.03ms | -0.0079ms | -24.03% |
| p99 | 0.06ms | 0.08ms | -0.02ms | -28.72% |
| mean | 0.01ms | 0.02ms | -0.0023ms | -14.87% |
| min | 0.0091ms | 0.0093ms | -0.00020ms | -2.15% |
| max | 0.10ms | 0.14ms | -0.03ms | -24.88% |
| total | 2.65ms | 3.11ms | -0.46ms | -14.87% |

