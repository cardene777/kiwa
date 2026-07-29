# Perf Suite — macos-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00045ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00091ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createMacAppEnv | 0.00054ms | 0.0019ms | 5ms | 0.00091ms | PASS | stable (検知には +0.00091ms (baseline 比 +156%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| simulateUserInteraction | 0.00046ms | 0.0013ms | 5ms | 0.00091ms | PASS | stable (検知には +0.00091ms (baseline 比 +182%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| captureAccessibilityTree | 0.00067ms | 0.0014ms | 5ms | 0.00091ms | PASS | stable (検知には +0.00091ms (baseline 比 +136%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| mockScreencap | 0.0029ms | 0.0046ms | 5ms | 0.00091ms | PASS | stable — gate 無効 (regressionGate=false) |
| emitUserNotification | 0.00033ms | 0.00054ms | 5ms | 0.00091ms | PASS | stable (検知には +0.00091ms (baseline 比 +273%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createMacAppEnv | 0.02ms | 10ms | PASS |
| simulateUserInteraction | 0.03ms | 10ms | PASS |
| captureAccessibilityTree | 0.04ms | 10ms | PASS |
| mockScreencap | 0.02ms | 10ms | PASS |
| emitUserNotification | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createMacAppEnv | -7816 B | 0 B | 102400 B | yes | PASS |
| simulateUserInteraction | 39304 B | 0 B | 102400 B | yes | PASS |
| captureAccessibilityTree | 4776 B | 0 B | 102400 B | yes | PASS |
| mockScreencap | 712 B | -113240 B | 102400 B | yes | PASS |
| emitUserNotification | 31536 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createMacAppEnv

# Perf Report — createMacAppEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0019ms |
| p99 | 0.0082ms |
| mean | 0.00098ms |
| stdev | 0.0014ms |
| min | 0.00050ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00058ms | -0.000041ms | -7.03% |
| p50 | 0.00058ms | 0.00063ms | -0.000041ms | -6.56% |
| p95 | 0.0019ms | 0.0022ms | -0.00029ms | -13.12% |
| p99 | 0.0082ms | 0.0059ms | +0.0023ms | +39.38% |
| mean | 0.00098ms | 0.00096ms | +0.000018ms | +1.86% |
| min | 0.00050ms | 0.00054ms | -0.000041ms | -7.58% |
| max | 0.01ms | 0.01ms | +0.0026ms | +24.80% |
| total | 0.20ms | 0.19ms | +0.0036ms | +1.86% |

### simulateUserInteraction

# Perf Report — simulateUserInteraction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00046ms |
| p95 | 0.0013ms |
| p99 | 0.0037ms |
| mean | 0.00063ms |
| stdev | 0.00073ms |
| min | 0.00042ms |
| max | 0.0071ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p50 | 0.00046ms | 0.00054ms | -0.000083ms | -15.31% |
| p95 | 0.0013ms | 0.00071ms | +0.00058ms | +81.70% |
| p99 | 0.0037ms | 0.0025ms | +0.0012ms | +49.73% |
| mean | 0.00063ms | 0.00062ms | +0.0000096ms | +1.55% |
| min | 0.00042ms | 0.00046ms | -0.000043ms | -9.37% |
| max | 0.0071ms | 0.0048ms | +0.0022ms | +46.52% |
| total | 0.13ms | 0.12ms | +0.0019ms | +1.55% |

### captureAccessibilityTree

# Perf Report — captureAccessibilityTree.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00075ms |
| p95 | 0.0014ms |
| p99 | 0.0056ms |
| mean | 0.0012ms |
| stdev | 0.0043ms |
| min | 0.00063ms |
| max | 0.06ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00067ms | 0.00067ms | +0.0000010ms | +0.15% |
| p50 | 0.00075ms | 0.00075ms | 0.00ms | 0.00% |
| p95 | 0.0014ms | 0.0015ms | -0.00017ms | -10.76% |
| p99 | 0.0056ms | 0.0059ms | -0.00022ms | -3.71% |
| mean | 0.0012ms | 0.00096ms | +0.00022ms | +23.35% |
| min | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| max | 0.06ms | 0.02ms | +0.05ms | +284.77% |
| total | 0.24ms | 0.19ms | +0.04ms | +23.35% |

### mockScreencap

# Perf Report — mockScreencap.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0029ms |
| p50 | 0.0030ms |
| p95 | 0.0046ms |
| p99 | 0.0057ms |
| mean | 0.0034ms |
| stdev | 0.0012ms |
| min | 0.0029ms |
| max | 0.01ms |
| total | 0.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0025ms | +0.00037ms | +14.75% |
| p50 | 0.0030ms | 0.0036ms | -0.00058ms | -16.27% |
| p95 | 0.0046ms | 0.0042ms | +0.00040ms | +9.57% |
| p99 | 0.0057ms | 0.0073ms | -0.0016ms | -22.37% |
| mean | 0.0034ms | 0.0033ms | +0.000070ms | +2.10% |
| min | 0.0029ms | 0.0025ms | +0.00037ms | +15.00% |
| max | 0.01ms | 0.01ms | +0.00071ms | +5.39% |
| total | 0.68ms | 0.67ms | +0.01ms | +2.10% |

### emitUserNotification

# Perf Report — emitUserNotification.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00054ms |
| p99 | 0.0040ms |
| mean | 0.00051ms |
| stdev | 0.00096ms |
| min | 0.00033ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | +0.0000010ms | +0.30% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00054ms | 0.00050ms | +0.000041ms | +8.21% |
| p99 | 0.0040ms | 0.0032ms | +0.00079ms | +24.57% |
| mean | 0.00051ms | 0.00045ms | +0.000069ms | +15.59% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.0058ms | +0.0051ms | +87.76% |
| total | 0.10ms | 0.09ms | +0.01ms | +15.59% |

