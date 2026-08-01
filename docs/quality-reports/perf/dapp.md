# Perf Suite — dapp

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| eventEmitterEmit | 0.00025ms | 0.0054ms | 5ms | 0.00075ms | PASS | stable (検知には +0.00075ms (baseline 比 +359%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| anvilKeyLookup | 0.00017ms | 0.00058ms | 5ms | 0.00071ms | PASS | stable (検知には +0.00071ms (baseline 比 +440%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| eventEmitterEmit | cpu | 0.09ms | 0.21ms | 0.00025ms | 0.003 | 0.003 | n/a | 20.0% | 0.00022ms | 0.00021ms |
| anvilKeyLookup | cpu | 0.09ms | 0.09ms | 0.00017ms | 0.002 | 0.002 | n/a | 20.0% | 0.00014ms | 0.00016ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| eventEmitterEmit | 0.01ms | 10ms | PASS |
| anvilKeyLookup | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| eventEmitterEmit | -32632 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| anvilKeyLookup | 408 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### eventEmitterEmit

# Perf Report — eventEmitterEmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00046ms |
| p95 | 0.0054ms |
| p99 | 0.01ms |
| mean | 0.0013ms |
| stdev | 0.0025ms |
| min | 0.00021ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.895)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00022ms | 0.00021ms | +0.000016ms | +7.53% |
| p50 | 0.00041ms | 0.00025ms | +0.00016ms | +63.90% |
| p95 | 0.0048ms | 0.0023ms | +0.0026ms | +115.36% |
| p99 | 0.01ms | 0.0082ms | +0.0024ms | +29.92% |
| mean | 0.0012ms | 0.00060ms | +0.00056ms | +92.99% |
| min | 0.00019ms | 0.00017ms | +0.000020ms | +12.10% |
| max | 0.02ms | 0.01ms | +0.0050ms | +38.33% |
| total | 0.23ms | 0.12ms | +0.11ms | +92.99% |

### anvilKeyLookup

# Perf Report — anvilKeyLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00058ms |
| p99 | 0.0016ms |
| mean | 0.00027ms |
| stdev | 0.00036ms |
| min | 0.00017ms |
| max | 0.0041ms |
| total | 0.05ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.855)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00014ms | 0.00016ms | -0.000019ms | -11.81% |
| p50 | 0.00018ms | 0.00017ms | +0.000011ms | +6.48% |
| p95 | 0.00050ms | 0.00034ms | +0.00016ms | +45.62% |
| p99 | 0.0014ms | 0.0037ms | -0.0023ms | -63.10% |
| mean | 0.00023ms | 0.00026ms | -0.000036ms | -13.62% |
| min | 0.00014ms | 0.00013ms | +0.000017ms | +13.53% |
| max | 0.0035ms | 0.0060ms | -0.0025ms | -41.42% |
| total | 0.05ms | 0.05ms | -0.0072ms | -13.62% |

