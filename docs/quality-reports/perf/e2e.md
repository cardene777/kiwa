# Perf Suite — e2e

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| fetchOverLoopback | 0.18ms | 0.94ms | 20ms | 0.00046ms | PASS | stable (換算後 p10 +9% (閾値未満)、 p95 +74% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| fetchOverLoopback | cpu | 0.09ms | 0.12ms | 0.18ms | 2.003 | 1.832 | n/a | 20.0% | 0.17ms | 0.15ms |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchOverLoopback | 1.68ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| fetchOverLoopback | 224200 B | 4269 B | 102400 B | yes | 110 (10 + 100) | PASS |

## Detailed serial reports

### fetchOverLoopback

# Perf Report — fetchOverLoopback.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.18ms |
| p50 | 0.26ms |
| p95 | 0.94ms |
| p99 | 1.18ms |
| mean | 0.35ms |
| stdev | 0.24ms |
| min | 0.16ms |
| max | 1.25ms |
| total | 34.68ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.926)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.17ms | 0.15ms | +0.01ms | +9.38% |
| p50 | 0.24ms | 0.18ms | +0.06ms | +34.69% |
| p95 | 0.87ms | 0.50ms | +0.37ms | +74.38% |
| p99 | 1.09ms | 0.66ms | +0.44ms | +66.47% |
| mean | 0.32ms | 0.22ms | +0.10ms | +42.96% |
| min | 0.15ms | 0.14ms | +0.0061ms | +4.32% |
| max | 1.15ms | 0.71ms | +0.45ms | +63.37% |
| total | 32.10ms | 22.45ms | +9.65ms | +42.96% |

