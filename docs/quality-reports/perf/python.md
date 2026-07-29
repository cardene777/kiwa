# Perf Suite — python

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dispatchRequest | 0.00042ms | 0.0013ms | 5ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderTemplate | 0.00042ms | 0.0012ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureMiddlewareCall | 0.00017ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +199%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| dispatchRequest | cpu | 0.08ms | 0.00042ms | 0.005 | 0.005 | 0.00040ms | 0.00038ms |
| renderTemplate | cpu | 0.08ms | 0.00042ms | 0.005 | 0.005 | 0.00042ms | 0.00042ms |
| captureMiddlewareCall | cpu | 0.08ms | 0.00017ms | 0.002 | 0.002 | 0.00017ms | 0.00017ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dispatchRequest | 0.01ms | 10ms | PASS |
| renderTemplate | 0.02ms | 10ms | PASS |
| captureMiddlewareCall | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dispatchRequest | -14576 B | 0 B | 102400 B | yes | PASS |
| renderTemplate | -18080 B | 0 B | 102400 B | yes | PASS |
| captureMiddlewareCall | 744 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dispatchRequest

# Perf Report — dispatchRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.0013ms |
| p99 | 0.0042ms |
| mean | 0.00063ms |
| stdev | 0.00082ms |
| min | 0.00038ms |
| max | 0.0077ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00038ms | +0.000041ms | +10.93% |
| p50 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p95 | 0.0013ms | 0.0015ms | -0.00021ms | -13.29% |
| p99 | 0.0042ms | 0.0053ms | -0.0011ms | -21.31% |
| mean | 0.00063ms | 0.00064ms | -0.000013ms | -1.97% |
| min | 0.00038ms | 0.00033ms | +0.000042ms | +12.61% |
| max | 0.0077ms | 0.0095ms | -0.0018ms | -18.95% |
| total | 0.13ms | 0.13ms | -0.0025ms | -1.97% |

### renderTemplate

# Perf Report — renderTemplate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0012ms |
| p99 | 0.0055ms |
| mean | 0.00067ms |
| stdev | 0.0014ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p50 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p95 | 0.0012ms | 0.0015ms | -0.00030ms | -19.94% |
| p99 | 0.0055ms | 0.02ms | -0.01ms | -65.95% |
| mean | 0.00067ms | 0.00092ms | -0.00025ms | -26.95% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | -0.0042ms | -18.94% |
| total | 0.13ms | 0.18ms | -0.05ms | -26.95% |

### captureMiddlewareCall

# Perf Report — captureMiddlewareCall.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00025ms |
| p99 | 0.0035ms |
| mean | 0.00032ms |
| stdev | 0.0011ms |
| min | 0.00013ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p95 | 0.00025ms | 0.00034ms | -0.000090ms | -26.51% |
| p99 | 0.0035ms | 0.0048ms | -0.0013ms | -26.24% |
| mean | 0.00032ms | 0.00040ms | -0.000084ms | -20.85% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.02ms | -0.0075ms | -35.66% |
| total | 0.06ms | 0.08ms | -0.02ms | -20.85% |

