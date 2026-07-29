# Perf Suite — macos-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createMacAppEnv | 0.00042ms | 0.0018ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| simulateUserInteraction | 0.00042ms | 0.00071ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureAccessibilityTree | 0.00054ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mockScreencap | 0.00088ms | 0.0039ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| emitUserNotification | 0.00033ms | 0.00084ms | 5ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +101%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| createMacAppEnv | cpu | 0.08ms | 0.00042ms | 0.005 | 0.005 | 0.00042ms | 0.00042ms |
| simulateUserInteraction | cpu | 0.08ms | 0.00042ms | 0.005 | 0.006 | 0.00042ms | 0.00046ms |
| captureAccessibilityTree | cpu | 0.08ms | 0.00054ms | 0.007 | 0.007 | 0.00054ms | 0.00054ms |
| mockScreencap | cpu | 0.08ms | 0.00088ms | 0.011 | 0.011 | 0.00088ms | 0.00088ms |
| emitUserNotification | cpu | 0.08ms | 0.00033ms | 0.004 | 0.004 | 0.00034ms | 0.00033ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createMacAppEnv | 0.02ms | 10ms | PASS |
| simulateUserInteraction | 0.01ms | 10ms | PASS |
| captureAccessibilityTree | 0.01ms | 10ms | PASS |
| mockScreencap | 0.02ms | 10ms | PASS |
| emitUserNotification | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createMacAppEnv | 242112 B | 0 B | 102400 B | yes | PASS |
| simulateUserInteraction | 14432 B | 0 B | 102400 B | yes | PASS |
| captureAccessibilityTree | 384 B | 0 B | 102400 B | yes | PASS |
| mockScreencap | 744 B | -17784 B | 102400 B | yes | PASS |
| emitUserNotification | 32976 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createMacAppEnv

# Perf Report — createMacAppEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.0018ms |
| p99 | 0.0042ms |
| mean | 0.00075ms |
| stdev | 0.0012ms |
| min | 0.00038ms |
| max | 0.01ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | -0.0000010ms | -0.24% |
| p50 | 0.00042ms | 0.00050ms | -0.000083ms | -16.60% |
| p95 | 0.0018ms | 0.0027ms | -0.00089ms | -33.27% |
| p99 | 0.0042ms | 0.0093ms | -0.0051ms | -55.37% |
| mean | 0.00075ms | 0.00098ms | -0.00023ms | -23.25% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.01ms | 0.02ms | -0.0047ms | -29.35% |
| total | 0.15ms | 0.20ms | -0.05ms | -23.25% |

### simulateUserInteraction

# Perf Report — simulateUserInteraction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.00071ms |
| p99 | 0.0036ms |
| mean | 0.00059ms |
| stdev | 0.00088ms |
| min | 0.00042ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000042ms | -9.17% |
| p50 | 0.00046ms | 0.00046ms | -0.0000010ms | -0.22% |
| p95 | 0.00071ms | 0.0016ms | -0.00085ms | -54.53% |
| p99 | 0.0036ms | 0.0083ms | -0.0047ms | -57.08% |
| mean | 0.00059ms | 0.00076ms | -0.00017ms | -22.37% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.0039ms | -26.42% |
| total | 0.12ms | 0.15ms | -0.03ms | -22.37% |

### captureAccessibilityTree

# Perf Report — captureAccessibilityTree.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00071ms |
| p95 | 0.0011ms |
| p99 | 0.0039ms |
| mean | 0.00080ms |
| stdev | 0.00062ms |
| min | 0.00046ms |
| max | 0.0063ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00054ms | -0.0000010ms | -0.18% |
| p50 | 0.00071ms | 0.00071ms | -0.0000010ms | -0.14% |
| p95 | 0.0011ms | 0.0017ms | -0.00059ms | -35.19% |
| p99 | 0.0039ms | 0.01ms | -0.0062ms | -61.37% |
| mean | 0.00080ms | 0.0010ms | -0.00020ms | -20.18% |
| min | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| max | 0.0063ms | 0.02ms | -0.01ms | -68.46% |
| total | 0.16ms | 0.20ms | -0.04ms | -20.18% |

### mockScreencap

# Perf Report — mockScreencap.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.0010ms |
| p95 | 0.0039ms |
| p99 | 0.0089ms |
| mean | 0.0016ms |
| stdev | 0.0018ms |
| min | 0.00083ms |
| max | 0.02ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00088ms | 0.00ms | 0.00% |
| p50 | 0.0010ms | 0.00092ms | +0.000084ms | +9.17% |
| p95 | 0.0039ms | 0.0040ms | -0.00016ms | -3.92% |
| p99 | 0.0089ms | 0.010ms | -0.0011ms | -10.98% |
| mean | 0.0016ms | 0.0016ms | -0.000013ms | -0.82% |
| min | 0.00083ms | 0.00079ms | +0.000041ms | +5.18% |
| max | 0.02ms | 0.02ms | -0.0033ms | -16.96% |
| total | 0.32ms | 0.32ms | -0.0027ms | -0.82% |

### emitUserNotification

# Perf Report — emitUserNotification.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00033ms |
| p95 | 0.00084ms |
| p99 | 0.0035ms |
| mean | 0.00050ms |
| stdev | 0.00093ms |
| min | 0.00029ms |
| max | 0.0097ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00033ms | 0.00038ms | -0.000041ms | -10.93% |
| p95 | 0.00084ms | 0.0017ms | -0.00084ms | -50.09% |
| p99 | 0.0035ms | 0.01ms | -0.0092ms | -72.62% |
| mean | 0.00050ms | 0.00073ms | -0.00023ms | -30.93% |
| min | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| max | 0.0097ms | 0.02ms | -0.0059ms | -37.77% |
| total | 0.10ms | 0.15ms | -0.05ms | -30.93% |

