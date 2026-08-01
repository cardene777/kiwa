# Perf Suite — graphql

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| parseGraphQLOperation | 0.00075ms | 0.0023ms | 5ms | 0.00072ms | PASS | stable — gate 無効 (regressionGate=false) |
| executeQuery | 0.0010ms | 0.0025ms | 5ms | 0.00072ms | PASS | stable — gate 無効 (regressionGate=false) |
| clientQuery | 0.0010ms | 0.04ms | 5ms | 0.00072ms | PASS | stable (換算後 p10 -2% (閾値未満)、 p95 +926% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| parseGraphQLOperation | cpu | 0.09ms | 0.09ms | 0.00075ms | 0.008 | 0.009 | n/a | 20.0% | 0.00065ms | 0.00075ms |
| executeQuery | cpu | 0.09ms | 0.09ms | 0.0010ms | 0.011 | 0.011 | n/a | 20.0% | 0.00087ms | 0.00092ms |
| clientQuery | cpu | 0.09ms | 1.26ms | 0.0010ms | 0.011 | 0.011 | n/a | 20.0% | 0.00090ms | 0.00092ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseGraphQLOperation | 0.02ms | 10ms | PASS |
| executeQuery | 0.02ms | 10ms | PASS |
| clientQuery | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| parseGraphQLOperation | -12048 B | -47572 B | 102400 B | yes | 220 (20 + 200) | PASS |
| executeQuery | 4464 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| clientQuery | 39296 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### parseGraphQLOperation

# Perf Report — parseGraphQLOperation.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00075ms |
| p50 | 0.00079ms |
| p95 | 0.0023ms |
| p99 | 0.01ms |
| mean | 0.0013ms |
| stdev | 0.0020ms |
| min | 0.00071ms |
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.866)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00065ms | 0.00075ms | -0.00010ms | -13.45% |
| p50 | 0.00069ms | 0.00083ms | -0.00015ms | -17.76% |
| p95 | 0.0020ms | 0.0098ms | -0.0078ms | -79.88% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -49.23% |
| mean | 0.0011ms | 0.0018ms | -0.00076ms | -41.11% |
| min | 0.00061ms | 0.00067ms | -0.000053ms | -7.99% |
| max | 0.01ms | 0.03ms | -0.02ms | -53.48% |
| total | 0.22ms | 0.37ms | -0.15ms | -41.11% |

### executeQuery

# Perf Report — executeQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0010ms |
| p95 | 0.0025ms |
| p99 | 0.0083ms |
| mean | 0.0014ms |
| stdev | 0.0013ms |
| min | 0.00096ms |
| max | 0.01ms |
| total | 0.27ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.871)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00087ms | 0.00092ms | -0.000046ms | -4.97% |
| p50 | 0.00091ms | 0.0011ms | -0.00018ms | -16.16% |
| p95 | 0.0022ms | 0.0079ms | -0.0057ms | -72.29% |
| p99 | 0.0072ms | 0.03ms | -0.02ms | -72.97% |
| mean | 0.0012ms | 0.0023ms | -0.0011ms | -48.81% |
| min | 0.00083ms | 0.00083ms | +0.0000018ms | +0.21% |
| max | 0.01ms | 0.04ms | -0.03ms | -73.73% |
| total | 0.24ms | 0.46ms | -0.22ms | -48.81% |

### clientQuery

# Perf Report — clientQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0019ms |
| p95 | 0.04ms |
| p99 | 0.10ms |
| mean | 0.03ms |
| stdev | 0.28ms |
| min | 0.0010ms |
| max | 3.64ms |
| total | 6.57ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.860)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00090ms | 0.00092ms | -0.000020ms | -2.16% |
| p50 | 0.0016ms | 0.0010ms | +0.00055ms | +53.08% |
| p95 | 0.03ms | 0.0031ms | +0.03ms | +926.24% |
| p99 | 0.09ms | 0.0059ms | +0.08ms | +1357.03% |
| mean | 0.03ms | 0.0015ms | +0.03ms | +1761.88% |
| min | 0.00086ms | 0.00088ms | -0.000015ms | -1.70% |
| max | 3.13ms | 0.03ms | +3.10ms | +9615.91% |
| total | 5.65ms | 0.30ms | +5.35ms | +1761.88% |

