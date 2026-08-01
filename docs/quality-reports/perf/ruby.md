# Perf Suite — ruby

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dispatchRailsRequest | 0.00042ms | 0.0026ms | 5ms | 0.00030ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatchGenericRequest | 0.00046ms | 0.00084ms | 5ms | 0.00030ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderERB | 0.00042ms | 0.0013ms | 5ms | 0.00030ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| dispatchRailsRequest | cpu | 0.09ms | 0.10ms | 0.00042ms | 0.005 | 0.005 | n/a | 20.0% | 0.00038ms | 0.00038ms |
| dispatchGenericRequest | cpu | 0.09ms | 0.09ms | 0.00046ms | 0.005 | 0.005 | n/a | 20.0% | 0.00042ms | 0.00042ms |
| renderERB | cpu | 0.09ms | 0.09ms | 0.00042ms | 0.005 | 0.005 | n/a | 20.0% | 0.00038ms | 0.00038ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dispatchRailsRequest | 0.01ms | 10ms | PASS |
| dispatchGenericRequest | 0.01ms | 10ms | PASS |
| renderERB | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| dispatchRailsRequest | 224168 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| dispatchGenericRequest | 4424 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| renderERB | -2368 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### dispatchRailsRequest

# Perf Report — dispatchRailsRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0026ms |
| p99 | 0.0074ms |
| mean | 0.00087ms |
| stdev | 0.0019ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.906)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | +0.0000020ms | +0.54% |
| p50 | 0.00042ms | 0.00042ms | -0.0000019ms | -0.46% |
| p95 | 0.0024ms | 0.0035ms | -0.0011ms | -31.15% |
| p99 | 0.0067ms | 0.0068ms | -0.000040ms | -0.59% |
| mean | 0.00079ms | 0.00096ms | -0.00017ms | -17.54% |
| min | 0.00034ms | 0.00033ms | +0.0000069ms | +2.06% |
| max | 0.02ms | 0.01ms | +0.0072ms | +56.88% |
| total | 0.16ms | 0.19ms | -0.03ms | -17.54% |

### dispatchGenericRequest

# Perf Report — dispatchGenericRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.00084ms |
| p99 | 0.0027ms |
| mean | 0.00058ms |
| stdev | 0.00052ms |
| min | 0.00042ms |
| max | 0.0059ms |
| total | 0.12ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.908)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | -2.8e-7ms | -0.07% |
| p50 | 0.00045ms | 0.00046ms | -0.0000042ms | -0.91% |
| p95 | 0.00077ms | 0.0016ms | -0.00085ms | -52.70% |
| p99 | 0.0024ms | 0.0065ms | -0.0040ms | -62.41% |
| mean | 0.00053ms | 0.00076ms | -0.00023ms | -30.45% |
| min | 0.00038ms | 0.00038ms | +0.0000035ms | +0.94% |
| max | 0.0053ms | 0.02ms | -0.01ms | -66.14% |
| total | 0.11ms | 0.15ms | -0.05ms | -30.45% |

### renderERB

# Perf Report — renderERB.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0013ms |
| p99 | 0.01ms |
| mean | 0.00084ms |
| stdev | 0.0024ms |
| min | 0.00042ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.902)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | +0.0000011ms | +0.30% |
| p50 | 0.00041ms | 0.00042ms | -0.0000039ms | -0.93% |
| p95 | 0.0012ms | 0.0013ms | -0.00012ms | -9.51% |
| p99 | 0.01ms | 0.0089ms | +0.0019ms | +21.23% |
| mean | 0.00076ms | 0.00076ms | -0.0000043ms | -0.56% |
| min | 0.00038ms | 0.00038ms | +2.4e-7ms | +0.06% |
| max | 0.02ms | 0.02ms | +0.0030ms | +15.55% |
| total | 0.15ms | 0.15ms | -0.00086ms | -0.56% |

