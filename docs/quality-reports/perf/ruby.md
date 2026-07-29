# Perf Suite — ruby

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dispatchRailsRequest | 0.00033ms | 0.0026ms | 5ms | 0.00034ms | PASS | stable (p10 -8% (閾値未満)、 p95 +33% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| dispatchGenericRequest | 0.00042ms | 0.0011ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderERB | 0.00042ms | 0.0011ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| dispatchRailsRequest | cpu | 0.08ms | 0.00033ms | 0.004 | 0.005 | 0.00034ms | 0.00038ms |
| dispatchGenericRequest | cpu | 0.08ms | 0.00042ms | 0.005 | 0.005 | 0.00042ms | 0.00042ms |
| renderERB | cpu | 0.08ms | 0.00042ms | 0.005 | 0.005 | 0.00042ms | 0.00041ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dispatchRailsRequest | 0.01ms | 10ms | PASS |
| dispatchGenericRequest | 0.01ms | 10ms | PASS |
| renderERB | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dispatchRailsRequest | -14512 B | 0 B | 102400 B | yes | PASS |
| dispatchGenericRequest | -376 B | 0 B | 102400 B | yes | PASS |
| renderERB | 221600 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dispatchRailsRequest

# Perf Report — dispatchRailsRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.0026ms |
| p99 | 0.0064ms |
| mean | 0.00074ms |
| stdev | 0.0012ms |
| min | 0.00033ms |
| max | 0.0098ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p50 | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| p95 | 0.0026ms | 0.0021ms | +0.00059ms | +28.45% |
| p99 | 0.0064ms | 0.0087ms | -0.0023ms | -26.79% |
| mean | 0.00074ms | 0.00074ms | -0.0000042ms | -0.56% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.0098ms | 0.01ms | -0.0011ms | -10.31% |
| total | 0.15ms | 0.15ms | -0.00083ms | -0.56% |

### dispatchGenericRequest

# Perf Report — dispatchGenericRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.0011ms |
| p99 | 0.0075ms |
| mean | 0.00067ms |
| stdev | 0.0014ms |
| min | 0.00038ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | -0.0000010ms | -0.24% |
| p50 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p95 | 0.0011ms | 0.0012ms | -0.00012ms | -10.00% |
| p99 | 0.0075ms | 0.0051ms | +0.0024ms | +47.51% |
| mean | 0.00067ms | 0.00064ms | +0.000029ms | +4.50% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.0090ms | +0.0058ms | +65.11% |
| total | 0.13ms | 0.13ms | +0.0058ms | +4.50% |

### renderERB

# Perf Report — renderERB.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.0011ms |
| p99 | 0.01ms |
| mean | 0.00071ms |
| stdev | 0.0018ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00041ms | +0.0000041ms | +1.00% |
| p50 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p95 | 0.0011ms | 0.0078ms | -0.0067ms | -85.62% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -50.21% |
| mean | 0.00071ms | 0.0016ms | -0.00088ms | -55.24% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.03ms | -0.02ms | -48.34% |
| total | 0.14ms | 0.32ms | -0.18ms | -55.24% |

