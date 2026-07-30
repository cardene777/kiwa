# Perf Suite — ruby

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dispatchRailsRequest | 0.00038ms | 0.0032ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatchGenericRequest | 0.00042ms | 0.0016ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderERB | 0.00038ms | 0.0033ms | 5ms | 0.00032ms | PASS | stable (換算後 p10 -4% (閾値未満)、 p95 +146% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| dispatchRailsRequest | cpu | 0.08ms | 0.09ms | 0.00038ms | 0.005 | 0.005 | 0.00037ms | 0.00038ms |
| dispatchGenericRequest | cpu | 0.08ms | 0.09ms | 0.00042ms | 0.005 | 0.005 | 0.00042ms | 0.00042ms |
| renderERB | cpu | 0.08ms | 0.10ms | 0.00038ms | 0.004 | 0.005 | 0.00036ms | 0.00038ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dispatchRailsRequest | 0.02ms | 10ms | PASS |
| dispatchGenericRequest | 0.02ms | 10ms | PASS |
| renderERB | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dispatchRailsRequest | 332232 B | 0 B | 102400 B | yes | PASS |
| dispatchGenericRequest | -424 B | 0 B | 102400 B | yes | PASS |
| renderERB | -2368 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dispatchRailsRequest

# Perf Report — dispatchRailsRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00044ms |
| p95 | 0.0032ms |
| p99 | 0.0063ms |
| mean | 0.0010ms |
| stdev | 0.0016ms |
| min | 0.00033ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.980)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00037ms | 0.00038ms | -0.0000075ms | -2.01% |
| p50 | 0.00043ms | 0.00042ms | +0.000012ms | +2.81% |
| p95 | 0.0032ms | 0.0035ms | -0.00031ms | -8.90% |
| p99 | 0.0062ms | 0.0068ms | -0.00055ms | -8.21% |
| mean | 0.00098ms | 0.00096ms | +0.000021ms | +2.23% |
| min | 0.00033ms | 0.00033ms | -0.0000067ms | -2.01% |
| max | 0.01ms | 0.01ms | +0.0013ms | +9.87% |
| total | 0.20ms | 0.19ms | +0.0043ms | +2.23% |

### dispatchGenericRequest

# Perf Report — dispatchGenericRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0016ms |
| p99 | 0.0093ms |
| mean | 0.00077ms |
| stdev | 0.0014ms |
| min | 0.00038ms |
| max | 0.01ms |
| total | 0.15ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.011)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | +0.0000047ms | +1.13% |
| p50 | 0.00046ms | 0.00046ms | +0.0000052ms | +1.13% |
| p95 | 0.0016ms | 0.0016ms | -0.000025ms | -1.56% |
| p99 | 0.0094ms | 0.0065ms | +0.0029ms | +45.13% |
| mean | 0.00078ms | 0.00076ms | +0.000021ms | +2.71% |
| min | 0.00038ms | 0.00038ms | +0.0000042ms | +1.13% |
| max | 0.01ms | 0.02ms | -0.0055ms | -34.99% |
| total | 0.16ms | 0.15ms | +0.0041ms | +2.71% |

### renderERB

# Perf Report — renderERB.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00046ms |
| p95 | 0.0033ms |
| p99 | 0.01ms |
| mean | 0.0010ms |
| stdev | 0.0024ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.961)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00036ms | 0.00038ms | -0.000015ms | -3.89% |
| p50 | 0.00044ms | 0.00042ms | +0.000023ms | +5.56% |
| p95 | 0.0032ms | 0.0013ms | +0.0019ms | +146.13% |
| p99 | 0.01ms | 0.0089ms | +0.0044ms | +49.40% |
| mean | 0.00098ms | 0.00076ms | +0.00022ms | +28.46% |
| min | 0.00036ms | 0.00038ms | -0.000015ms | -3.89% |
| max | 0.02ms | 0.02ms | -0.00066ms | -3.47% |
| total | 0.20ms | 0.15ms | +0.04ms | +28.46% |

