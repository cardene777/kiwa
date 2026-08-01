# Perf Suite — grpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeUnary | 0.00058ms | 0.01ms | 5ms | 0.00030ms | PASS | stable (換算後 p10 +3% (閾値未満)、 p95 +34% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeServerStream | 0.0010ms | 0.0024ms | 5ms | 0.00029ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| invokeUnary | cpu | 0.09ms | 0.19ms | 0.00058ms | 0.006 | 0.006 | n/a | 20.0% | 0.00052ms | 0.00050ms |
| invokeServerStream | cpu | 0.09ms | 0.10ms | 0.0010ms | 0.011 | 0.011 | n/a | 20.0% | 0.00087ms | 0.00092ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeUnary | 0.24ms | 10ms | PASS |
| invokeServerStream | 0.07ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| invokeUnary | -13592 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| invokeServerStream | -23320 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### invokeUnary

# Perf Report — invokeUnary.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.0013ms |
| p95 | 0.01ms |
| p99 | 0.04ms |
| mean | 0.0049ms |
| stdev | 0.02ms |
| min | 0.00054ms |
| max | 0.27ms |
| total | 0.98ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.884)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00052ms | 0.00050ms | +0.000015ms | +3.06% |
| p50 | 0.0012ms | 0.00058ms | +0.00059ms | +101.82% |
| p95 | 0.01ms | 0.0099ms | +0.0033ms | +33.92% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +66.22% |
| mean | 0.0043ms | 0.0022ms | +0.0022ms | +100.57% |
| min | 0.00048ms | 0.00050ms | -0.000022ms | -4.37% |
| max | 0.24ms | 0.04ms | +0.20ms | +493.79% |
| total | 0.86ms | 0.43ms | +0.43ms | +100.57% |

### invokeServerStream

# Perf Report — invokeServerStream.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0010ms |
| p95 | 0.0024ms |
| p99 | 0.0087ms |
| mean | 0.0014ms |
| stdev | 0.0017ms |
| min | 0.00096ms |
| max | 0.02ms |
| total | 0.28ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.873)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00087ms | 0.00092ms | -0.000044ms | -4.81% |
| p50 | 0.00091ms | 0.0010ms | -0.00013ms | -12.71% |
| p95 | 0.0021ms | 0.0089ms | -0.0068ms | -76.15% |
| p99 | 0.0076ms | 0.02ms | -0.01ms | -59.68% |
| mean | 0.0012ms | 0.0020ms | -0.00079ms | -38.94% |
| min | 0.00084ms | 0.00088ms | -0.000039ms | -4.43% |
| max | 0.02ms | 0.02ms | -0.0047ms | -21.64% |
| total | 0.25ms | 0.40ms | -0.16ms | -38.94% |

