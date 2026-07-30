# Perf Suite — python

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dispatchRequest | 0.00042ms | 0.0023ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderTemplate | 0.00042ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureMiddlewareCall | 0.00017ms | 0.00025ms | 5ms | 0.00032ms | PASS | stable (検知には +0.00032ms (baseline 比 +193%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| dispatchRequest | cpu | 0.08ms | 0.09ms | 0.00042ms | 0.005 | 0.005 | 0.00042ms | 0.00042ms |
| renderTemplate | cpu | 0.08ms | 0.08ms | 0.00042ms | 0.005 | 0.005 | 0.00041ms | 0.00042ms |
| captureMiddlewareCall | cpu | 0.08ms | 0.08ms | 0.00017ms | 0.002 | 0.002 | 0.00016ms | 0.00017ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dispatchRequest | 0.02ms | 10ms | PASS |
| renderTemplate | 0.01ms | 10ms | PASS |
| captureMiddlewareCall | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dispatchRequest | -4504 B | 0 B | 102400 B | yes | PASS |
| renderTemplate | -18064 B | 0 B | 102400 B | yes | PASS |
| captureMiddlewareCall | 1664 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dispatchRequest

# Perf Report — dispatchRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0023ms |
| p99 | 0.0079ms |
| mean | 0.00082ms |
| stdev | 0.0014ms |
| min | 0.00038ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.011)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | +0.0000047ms | +1.13% |
| p50 | 0.00046ms | 0.00046ms | +0.0000057ms | +1.24% |
| p95 | 0.0024ms | 0.0033ms | -0.00089ms | -27.33% |
| p99 | 0.0080ms | 0.0092ms | -0.0012ms | -13.25% |
| mean | 0.00083ms | 0.00097ms | -0.00014ms | -14.63% |
| min | 0.00038ms | 0.00038ms | +0.0000042ms | +1.13% |
| max | 0.01ms | 0.01ms | +0.00055ms | +4.74% |
| total | 0.17ms | 0.19ms | -0.03ms | -14.63% |

### renderTemplate

# Perf Report — renderTemplate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00044ms |
| p95 | 0.0012ms |
| p99 | 0.0090ms |
| mean | 0.00078ms |
| stdev | 0.0021ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.994)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00041ms | 0.00042ms | -0.0000026ms | -0.62% |
| p50 | 0.00043ms | 0.00046ms | -0.000023ms | -5.07% |
| p95 | 0.0012ms | 0.0011ms | +0.000068ms | +5.98% |
| p99 | 0.0089ms | 0.01ms | -0.0025ms | -22.14% |
| mean | 0.00077ms | 0.00074ms | +0.000034ms | +4.60% |
| min | 0.00037ms | 0.00038ms | -0.0000023ms | -0.62% |
| max | 0.02ms | 0.01ms | +0.01ms | +72.96% |
| total | 0.15ms | 0.15ms | +0.0068ms | +4.60% |

### captureMiddlewareCall

# Perf Report — captureMiddlewareCall.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00025ms |
| p99 | 0.0018ms |
| mean | 0.00031ms |
| stdev | 0.0012ms |
| min | 0.00013ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.965)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00016ms | 0.00017ms | -0.0000059ms | -3.54% |
| p50 | 0.00016ms | 0.00017ms | -0.0000059ms | -3.54% |
| p95 | 0.00024ms | 0.00052ms | -0.00028ms | -53.13% |
| p99 | 0.0018ms | 0.0052ms | -0.0034ms | -65.78% |
| mean | 0.00030ms | 0.00040ms | -0.00010ms | -25.20% |
| min | 0.00012ms | 0.00013ms | -0.0000044ms | -3.54% |
| max | 0.01ms | 0.02ms | -0.0035ms | -19.80% |
| total | 0.06ms | 0.08ms | -0.02ms | -25.20% |

