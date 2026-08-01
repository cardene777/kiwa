# Perf Suite — trpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeProcedure_query | 0.00046ms | 0.0017ms | 5ms | 0.00077ms | PASS | stable (検知には +0.00077ms (baseline 比 +168%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| invokeProcedure_mutation | 0.00050ms | 0.00080ms | 5ms | 0.00077ms | PASS | stable (検知には +0.00077ms (baseline 比 +168%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| client_query | 0.00054ms | 0.0012ms | 5ms | 0.00076ms | PASS | stable (検知には +0.00076ms (baseline 比 +152%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| invokeProcedure_query | cpu | 0.09ms | 0.09ms | 0.00046ms | 0.005 | 0.006 | n/a | 20.0% | 0.00042ms | 0.00046ms |
| invokeProcedure_mutation | cpu | 0.09ms | 0.09ms | 0.00050ms | 0.006 | 0.006 | n/a | 20.0% | 0.00046ms | 0.00046ms |
| client_query | cpu | 0.09ms | 0.09ms | 0.00054ms | 0.006 | 0.006 | n/a | 20.0% | 0.00049ms | 0.00050ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeProcedure_query | 0.02ms | 10ms | PASS |
| invokeProcedure_mutation | 0.02ms | 10ms | PASS |
| client_query | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| invokeProcedure_query | -12976 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| invokeProcedure_mutation | -16432 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| client_query | 1552 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### invokeProcedure_query

# Perf Report — invokeProcedure_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0017ms |
| p99 | 0.0060ms |
| mean | 0.00082ms |
| stdev | 0.0018ms |
| min | 0.00046ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.920)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000037ms | -7.98% |
| p50 | 0.00046ms | 0.00050ms | -0.000040ms | -7.98% |
| p95 | 0.0016ms | 0.0045ms | -0.0030ms | -65.02% |
| p99 | 0.0055ms | 0.01ms | -0.0080ms | -59.23% |
| mean | 0.00075ms | 0.0013ms | -0.00051ms | -40.50% |
| min | 0.00042ms | 0.00042ms | +0.0000055ms | +1.31% |
| max | 0.02ms | 0.02ms | +0.0041ms | +25.18% |
| total | 0.15ms | 0.25ms | -0.10ms | -40.50% |

### invokeProcedure_mutation

# Perf Report — invokeProcedure_mutation.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00052ms |
| p95 | 0.00080ms |
| p99 | 0.0017ms |
| mean | 0.00058ms |
| stdev | 0.00028ms |
| min | 0.00046ms |
| max | 0.0032ms |
| total | 0.12ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.924)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | +0.0000042ms | +0.92% |
| p50 | 0.00048ms | 0.00050ms | -0.000019ms | -3.76% |
| p95 | 0.00074ms | 0.0011ms | -0.00035ms | -32.51% |
| p99 | 0.0016ms | 0.0039ms | -0.0023ms | -59.45% |
| mean | 0.00054ms | 0.00082ms | -0.00028ms | -34.25% |
| min | 0.00042ms | 0.00042ms | +0.0000064ms | +1.54% |
| max | 0.0030ms | 0.03ms | -0.02ms | -88.37% |
| total | 0.11ms | 0.16ms | -0.06ms | -34.25% |

### client_query

# Perf Report — client_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00054ms |
| p95 | 0.0012ms |
| p99 | 0.0050ms |
| mean | 0.00072ms |
| stdev | 0.00088ms |
| min | 0.00042ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.914)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00049ms | 0.00050ms | -0.0000056ms | -1.13% |
| p50 | 0.00050ms | 0.00058ms | -0.000088ms | -15.05% |
| p95 | 0.0011ms | 0.0064ms | -0.0052ms | -82.59% |
| p99 | 0.0046ms | 0.02ms | -0.02ms | -79.71% |
| mean | 0.00066ms | 0.0018ms | -0.0011ms | -62.45% |
| min | 0.00038ms | 0.00042ms | -0.000036ms | -8.62% |
| max | 0.0093ms | 0.03ms | -0.02ms | -67.83% |
| total | 0.13ms | 0.35ms | -0.22ms | -62.45% |

