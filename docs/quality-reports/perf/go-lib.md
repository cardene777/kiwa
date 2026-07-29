# Perf Suite — go-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeGinHandler | 0.00038ms | 0.0028ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeEchoHandler | 0.00050ms | 0.00071ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeFiberHandler | 0.00050ms | 0.0020ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureChiRoute | 0.00071ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| invokeGinHandler | cpu | 0.08ms | 0.00038ms | 0.005 | 0.005 | 0.00038ms | 0.00038ms |
| invokeEchoHandler | cpu | 0.08ms | 0.00050ms | 0.006 | 0.006 | 0.00049ms | 0.00046ms |
| invokeFiberHandler | cpu | 0.08ms | 0.00050ms | 0.006 | 0.006 | 0.00049ms | 0.00050ms |
| captureChiRoute | cpu | 0.08ms | 0.00071ms | 0.009 | 0.009 | 0.00069ms | 0.00071ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeGinHandler | 0.01ms | 10ms | PASS |
| invokeEchoHandler | 0.01ms | 10ms | PASS |
| invokeFiberHandler | 0.02ms | 10ms | PASS |
| captureChiRoute | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeGinHandler | -1064 B | 0 B | 102400 B | yes | PASS |
| invokeEchoHandler | -26352 B | 0 B | 102400 B | yes | PASS |
| invokeFiberHandler | -4192 B | 0 B | 102400 B | yes | PASS |
| captureChiRoute | -3960 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeGinHandler

# Perf Report — invokeGinHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0028ms |
| p99 | 0.0059ms |
| mean | 0.00086ms |
| stdev | 0.0011ms |
| min | 0.00033ms |
| max | 0.0093ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p95 | 0.0028ms | 0.0030ms | -0.00017ms | -5.77% |
| p99 | 0.0059ms | 0.0097ms | -0.0038ms | -39.20% |
| mean | 0.00086ms | 0.00093ms | -0.000063ms | -6.81% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.0093ms | 0.02ms | -0.0058ms | -38.40% |
| total | 0.17ms | 0.19ms | -0.01ms | -6.81% |

### invokeEchoHandler

# Perf Report — invokeEchoHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00050ms |
| p95 | 0.00071ms |
| p99 | 0.0039ms |
| mean | 0.00064ms |
| stdev | 0.00070ms |
| min | 0.00046ms |
| max | 0.0087ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00046ms | +0.000038ms | +8.28% |
| p50 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p95 | 0.00071ms | 0.0044ms | -0.0037ms | -83.88% |
| p99 | 0.0039ms | 0.02ms | -0.01ms | -76.90% |
| mean | 0.00064ms | 0.0012ms | -0.00057ms | -46.93% |
| min | 0.00046ms | 0.00042ms | +0.000042ms | +10.10% |
| max | 0.0087ms | 0.02ms | -0.01ms | -60.04% |
| total | 0.13ms | 0.24ms | -0.11ms | -46.93% |

### invokeFiberHandler

# Perf Report — invokeFiberHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0020ms |
| p99 | 0.0093ms |
| mean | 0.00090ms |
| stdev | 0.0018ms |
| min | 0.00046ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| p95 | 0.0020ms | 0.0040ms | -0.0019ms | -48.23% |
| p99 | 0.0093ms | 0.01ms | -0.0027ms | -22.46% |
| mean | 0.00090ms | 0.0011ms | -0.00018ms | -16.25% |
| min | 0.00046ms | 0.00046ms | +0.0000010ms | +0.22% |
| max | 0.02ms | 0.02ms | -0.0049ms | -24.17% |
| total | 0.18ms | 0.22ms | -0.04ms | -16.25% |

### captureChiRoute

# Perf Report — captureChiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00071ms |
| p50 | 0.00075ms |
| p95 | 0.0015ms |
| p99 | 0.0078ms |
| mean | 0.0010ms |
| stdev | 0.0014ms |
| min | 0.00067ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00071ms | 0.00071ms | 0.00ms | 0.00% |
| p50 | 0.00075ms | 0.00075ms | 0.00ms | 0.00% |
| p95 | 0.0015ms | 0.0038ms | -0.0023ms | -60.58% |
| p99 | 0.0078ms | 0.01ms | -0.0065ms | -45.47% |
| mean | 0.0010ms | 0.0015ms | -0.00049ms | -32.79% |
| min | 0.00067ms | 0.00067ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.05ms | -0.03ms | -67.90% |
| total | 0.20ms | 0.30ms | -0.10ms | -32.79% |

