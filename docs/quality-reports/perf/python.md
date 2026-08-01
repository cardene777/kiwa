# Perf Suite — python

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dispatchRequest | 0.00038ms | 0.0016ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderTemplate | 0.00042ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureMiddlewareCall | 0.00017ms | 0.00038ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +198%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| dispatchRequest | cpu | 0.08ms | 0.08ms | 0.00038ms | 0.005 | 0.005 | n/a | 20.0% | 0.00038ms | 0.00042ms |
| renderTemplate | cpu | 0.08ms | 0.08ms | 0.00042ms | 0.005 | 0.005 | n/a | 20.0% | 0.00041ms | 0.00042ms |
| captureMiddlewareCall | cpu | 0.08ms | 0.08ms | 0.00017ms | 0.002 | 0.002 | n/a | 20.0% | 0.00016ms | 0.00017ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dispatchRequest | 0.01ms | 10ms | PASS |
| renderTemplate | 0.02ms | 10ms | PASS |
| captureMiddlewareCall | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| dispatchRequest | 155072 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| renderTemplate | -16720 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| captureMiddlewareCall | 744 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### dispatchRequest

# Perf Report — dispatchRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0016ms |
| p99 | 0.0046ms |
| mean | 0.00072ms |
| stdev | 0.0011ms |
| min | 0.00033ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.016)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000035ms | -8.42% |
| p50 | 0.00042ms | 0.00046ms | -0.000034ms | -7.50% |
| p95 | 0.0017ms | 0.0033ms | -0.0016ms | -49.01% |
| p99 | 0.0047ms | 0.0092ms | -0.0045ms | -48.71% |
| mean | 0.00073ms | 0.00097ms | -0.00024ms | -24.37% |
| min | 0.00034ms | 0.00038ms | -0.000037ms | -9.78% |
| max | 0.01ms | 0.01ms | -0.0014ms | -12.19% |
| total | 0.15ms | 0.19ms | -0.05ms | -24.37% |

### renderTemplate

# Perf Report — renderTemplate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.0012ms |
| p99 | 0.0072ms |
| mean | 0.00069ms |
| stdev | 0.0015ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.981)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00041ms | 0.00042ms | -0.0000079ms | -1.90% |
| p50 | 0.00041ms | 0.00046ms | -0.000049ms | -10.68% |
| p95 | 0.0012ms | 0.0011ms | +0.000052ms | +4.54% |
| p99 | 0.0070ms | 0.01ms | -0.0044ms | -38.67% |
| mean | 0.00068ms | 0.00074ms | -0.000062ms | -8.39% |
| min | 0.00037ms | 0.00038ms | -0.0000071ms | -1.90% |
| max | 0.02ms | 0.01ms | +0.0024ms | +16.97% |
| total | 0.14ms | 0.15ms | -0.01ms | -8.39% |

### captureMiddlewareCall

# Perf Report — captureMiddlewareCall.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00038ms |
| p99 | 0.0070ms |
| mean | 0.00044ms |
| stdev | 0.0018ms |
| min | 0.00013ms |
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.989)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00016ms | 0.00017ms | -0.0000019ms | -1.14% |
| p50 | 0.00017ms | 0.00017ms | -0.0000019ms | -1.14% |
| p95 | 0.00037ms | 0.00052ms | -0.00015ms | -28.53% |
| p99 | 0.0069ms | 0.0052ms | +0.0017ms | +32.66% |
| mean | 0.00043ms | 0.00040ms | +0.000029ms | +7.31% |
| min | 0.00012ms | 0.00013ms | -0.0000014ms | -1.14% |
| max | 0.02ms | 0.02ms | +0.0034ms | +19.01% |
| total | 0.09ms | 0.08ms | +0.0059ms | +7.31% |

