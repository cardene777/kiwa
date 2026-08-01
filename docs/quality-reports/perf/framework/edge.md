# Perf Suite — edge

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeEdgeHandler | 0.01ms | 0.12ms | 5ms | 0.00036ms | PASS | stable (換算後 p10 +3% (閾値未満)、 p95 +237% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeEdgeHandlerWithKv | 0.0077ms | 0.0097ms | 5ms | 0.00036ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| invokeEdgeHandler | cpu | 0.09ms | 0.17ms | 0.01ms | 0.110 | 0.107 | n/a | 20.0% | 0.0088ms | 0.0086ms |
| invokeEdgeHandlerWithKv | cpu | 0.09ms | 0.09ms | 0.0077ms | 0.082 | 0.083 | n/a | 20.0% | 0.0065ms | 0.0067ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEdgeHandler | 0.58ms | 10ms | PASS |
| invokeEdgeHandlerWithKv | 0.08ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| invokeEdgeHandler | -373696 B | -9168 B | 102400 B | yes | 220 (20 + 200) | PASS |
| invokeEdgeHandlerWithKv | -720 B | -185 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### invokeEdgeHandler

# Perf Report — invokeEdgeHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.12ms |
| p99 | 0.25ms |
| mean | 0.04ms |
| stdev | 0.13ms |
| min | 0.0090ms |
| max | 1.73ms |
| total | 8.07ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.853)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0088ms | 0.0086ms | +0.00024ms | +2.80% |
| p50 | 0.01ms | 0.0099ms | +0.0012ms | +12.23% |
| p95 | 0.10ms | 0.03ms | +0.07ms | +237.30% |
| p99 | 0.21ms | 0.09ms | +0.13ms | +145.69% |
| mean | 0.03ms | 0.01ms | +0.02ms | +149.24% |
| min | 0.0076ms | 0.0076ms | +0.000020ms | +0.26% |
| max | 1.48ms | 0.10ms | +1.38ms | +1369.74% |
| total | 6.88ms | 2.76ms | +4.12ms | +149.24% |

### invokeEdgeHandlerWithKv

# Perf Report — invokeEdgeHandlerWithKv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0077ms |
| p50 | 0.0079ms |
| p95 | 0.0097ms |
| p99 | 0.02ms |
| mean | 0.0082ms |
| stdev | 0.0013ms |
| min | 0.0075ms |
| max | 0.02ms |
| total | 1.64ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.854)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0065ms | 0.0067ms | -0.00012ms | -1.80% |
| p50 | 0.0067ms | 0.0070ms | -0.00028ms | -3.94% |
| p95 | 0.0083ms | 0.0091ms | -0.00082ms | -8.94% |
| p99 | 0.01ms | 0.01ms | +0.00027ms | +1.98% |
| mean | 0.0070ms | 0.0074ms | -0.00037ms | -4.98% |
| min | 0.0064ms | 0.0064ms | -0.000012ms | -0.18% |
| max | 0.02ms | 0.02ms | -0.0053ms | -25.11% |
| total | 1.40ms | 1.48ms | -0.07ms | -4.98% |

