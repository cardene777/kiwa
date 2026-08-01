# Perf Suite — orm

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| drizzleInsert | 0.01ms | 0.03ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| drizzleSelectAll | 0.24ms | 0.32ms | 20ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| drizzleSelectWhere | 0.02ms | 0.02ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| drizzleInsert | cpu | 0.08ms | 0.09ms | 0.01ms | 0.134 | 0.133 | n/a | 20.0% | 0.01ms | 0.01ms |
| drizzleSelectAll | cpu | 0.08ms | 0.08ms | 0.24ms | 2.949 | 2.980 | n/a | 20.0% | 0.24ms | 0.25ms |
| drizzleSelectWhere | cpu | 0.08ms | 0.08ms | 0.02ms | 0.209 | 0.205 | n/a | 20.0% | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| drizzleInsert | 0.19ms | 20ms | PASS |
| drizzleSelectAll | 5.06ms | 40ms | PASS |
| drizzleSelectWhere | 0.19ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| drizzleInsert | -130576 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| drizzleSelectAll | -31992 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| drizzleSelectWhere | 8040 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### drizzleInsert

# Perf Report — drizzleInsert.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.0099ms |
| min | 0.01ms |
| max | 0.09ms |
| total | 3.13ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.995)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00011ms | +0.98% |
| p50 | 0.01ms | 0.01ms | -0.00017ms | -1.30% |
| p95 | 0.03ms | 0.03ms | -0.0062ms | -18.00% |
| p99 | 0.08ms | 0.06ms | +0.02ms | +24.86% |
| mean | 0.02ms | 0.02ms | -0.00082ms | -5.02% |
| min | 0.01ms | 0.0099ms | +0.00016ms | +1.57% |
| max | 0.09ms | 0.10ms | -0.01ms | -10.69% |
| total | 3.12ms | 3.28ms | -0.16ms | -5.02% |

### drizzleSelectAll

# Perf Report — drizzleSelectAll.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.24ms |
| p50 | 0.25ms |
| p95 | 0.32ms |
| p99 | 0.44ms |
| mean | 0.26ms |
| stdev | 0.04ms |
| min | 0.23ms |
| max | 0.53ms |
| total | 52.61ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.019)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.24ms | 0.25ms | -0.0025ms | -1.03% |
| p50 | 0.25ms | 0.28ms | -0.03ms | -9.66% |
| p95 | 0.32ms | 0.45ms | -0.12ms | -27.51% |
| p99 | 0.45ms | 0.87ms | -0.43ms | -49.09% |
| mean | 0.27ms | 0.31ms | -0.04ms | -12.54% |
| min | 0.24ms | 0.24ms | -0.0018ms | -0.75% |
| max | 0.54ms | 1.20ms | -0.66ms | -55.11% |
| total | 53.61ms | 61.30ms | -7.69ms | -12.54% |

### drizzleSelectWhere

# Perf Report — drizzleSelectWhere.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0058ms |
| min | 0.02ms |
| max | 0.09ms |
| total | 3.78ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.008)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00034ms | +1.99% |
| p50 | 0.02ms | 0.02ms | -0.00095ms | -5.02% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -31.64% |
| p99 | 0.04ms | 0.10ms | -0.06ms | -62.41% |
| mean | 0.02ms | 0.02ms | -0.0026ms | -12.16% |
| min | 0.02ms | 0.02ms | +0.00025ms | +1.53% |
| max | 0.09ms | 0.17ms | -0.09ms | -49.75% |
| total | 3.81ms | 4.33ms | -0.53ms | -12.16% |

