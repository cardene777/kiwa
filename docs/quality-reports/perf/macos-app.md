# Perf Suite — macos-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createMacAppEnv | 0.00042ms | 0.0044ms | 5ms | 0.00033ms | PASS | stable (換算後 p10 +0% (閾値未満)、 p95 +37% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| simulateUserInteraction | 0.00042ms | 0.0015ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureAccessibilityTree | 0.00054ms | 0.0043ms | 5ms | 0.00034ms | PASS | stable (換算後 p10 -4% (閾値未満)、 p95 +144% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| mockScreencap | 0.00088ms | 0.0041ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| emitUserNotification | 0.00033ms | 0.0019ms | 5ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +101%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| createMacAppEnv | cpu | 0.08ms | 0.08ms | 0.00042ms | 0.005 | 0.005 | 0.00042ms | 0.00042ms |
| simulateUserInteraction | cpu | 0.08ms | 0.09ms | 0.00042ms | 0.005 | 0.006 | 0.00042ms | 0.00046ms |
| captureAccessibilityTree | cpu | 0.08ms | 0.09ms | 0.00054ms | 0.007 | 0.007 | 0.00056ms | 0.00058ms |
| mockScreencap | cpu | 0.08ms | 0.08ms | 0.00088ms | 0.011 | 0.011 | 0.00088ms | 0.00088ms |
| emitUserNotification | cpu | 0.08ms | 0.09ms | 0.00033ms | 0.004 | 0.004 | 0.00034ms | 0.00033ms |

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
| createMacAppEnv | 70760 B | 0 B | 102400 B | yes | PASS |
| simulateUserInteraction | 15640 B | 0 B | 102400 B | yes | PASS |
| captureAccessibilityTree | -2592 B | 0 B | 102400 B | yes | PASS |
| mockScreencap | 664 B | -10488 B | 102400 B | yes | PASS |
| emitUserNotification | 38376 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createMacAppEnv

# Perf Report — createMacAppEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0044ms |
| p99 | 0.01ms |
| mean | 0.0011ms |
| stdev | 0.0025ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.007)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | +0.0000018ms | +0.43% |
| p50 | 0.00046ms | 0.00050ms | -0.000039ms | -7.79% |
| p95 | 0.0045ms | 0.0033ms | +0.0012ms | +36.61% |
| p99 | 0.01ms | 0.02ms | -0.0015ms | -9.17% |
| mean | 0.0011ms | 0.0012ms | -0.000089ms | -7.55% |
| min | 0.00038ms | 0.00038ms | +0.0000025ms | +0.67% |
| max | 0.02ms | 0.03ms | -0.0054ms | -21.03% |
| total | 0.22ms | 0.24ms | -0.02ms | -7.55% |

### simulateUserInteraction

# Perf Report — simulateUserInteraction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0015ms |
| p99 | 0.0065ms |
| mean | 0.00071ms |
| stdev | 0.0013ms |
| min | 0.00042ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.011)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000036ms | -7.96% |
| p50 | 0.00046ms | 0.00048ms | -0.000015ms | -3.23% |
| p95 | 0.0015ms | 0.0016ms | -0.000067ms | -4.21% |
| p99 | 0.0065ms | 0.0044ms | +0.0022ms | +49.94% |
| mean | 0.00072ms | 0.00075ms | -0.000031ms | -4.09% |
| min | 0.00042ms | 0.00042ms | +0.0000045ms | +1.09% |
| max | 0.02ms | 0.02ms | -0.0062ms | -29.18% |
| total | 0.14ms | 0.15ms | -0.0061ms | -4.09% |

### captureAccessibilityTree

# Perf Report — captureAccessibilityTree.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00075ms |
| p95 | 0.0043ms |
| p99 | 0.02ms |
| mean | 0.0015ms |
| stdev | 0.0036ms |
| min | 0.00050ms |
| max | 0.04ms |
| total | 0.30ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.033)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00056ms | 0.00058ms | -0.000024ms | -4.09% |
| p50 | 0.00077ms | 0.00075ms | +0.000025ms | +3.32% |
| p95 | 0.0045ms | 0.0018ms | +0.0026ms | +143.65% |
| p99 | 0.02ms | 0.0053ms | +0.01ms | +214.19% |
| mean | 0.0015ms | 0.0011ms | +0.00043ms | +39.42% |
| min | 0.00052ms | 0.00050ms | +0.000017ms | +3.32% |
| max | 0.04ms | 0.03ms | +0.01ms | +53.79% |
| total | 0.30ms | 0.22ms | +0.09ms | +39.42% |

### mockScreencap

# Perf Report — mockScreencap.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.0010ms |
| p95 | 0.0041ms |
| p99 | 0.02ms |
| mean | 0.0017ms |
| stdev | 0.0024ms |
| min | 0.00083ms |
| max | 0.03ms |
| total | 0.35ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.006)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00088ms | +0.0000050ms | +0.57% |
| p50 | 0.0010ms | 0.00096ms | +0.000048ms | +4.98% |
| p95 | 0.0042ms | 0.0042ms | -0.000014ms | -0.34% |
| p99 | 0.02ms | 0.0075ms | +0.0077ms | +102.92% |
| mean | 0.0017ms | 0.0016ms | +0.00011ms | +6.93% |
| min | 0.00084ms | 0.00083ms | +0.0000047ms | +0.57% |
| max | 0.03ms | 0.02ms | +0.0054ms | +26.96% |
| total | 0.35ms | 0.33ms | +0.02ms | +6.93% |

### emitUserNotification

# Perf Report — emitUserNotification.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00033ms |
| p95 | 0.0019ms |
| p99 | 0.0098ms |
| mean | 0.00075ms |
| stdev | 0.0018ms |
| min | 0.00029ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.012)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00034ms | 0.00033ms | +0.0000040ms | +1.20% |
| p50 | 0.00034ms | 0.00038ms | -0.000037ms | -9.86% |
| p95 | 0.0019ms | 0.0018ms | +0.000097ms | +5.38% |
| p99 | 0.010ms | 0.0091ms | +0.00087ms | +9.55% |
| mean | 0.00076ms | 0.00071ms | +0.000054ms | +7.65% |
| min | 0.00029ms | 0.00029ms | +0.0000035ms | +1.20% |
| max | 0.02ms | 0.01ms | +0.0038ms | +31.95% |
| total | 0.15ms | 0.14ms | +0.01ms | +7.65% |

