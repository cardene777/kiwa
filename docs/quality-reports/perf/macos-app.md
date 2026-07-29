# Perf Suite — macos-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createMacAppEnv | 0.00046ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable (差 0.00012ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| simulateUserInteraction | 0.00038ms | 0.00059ms | 5ms | 0.00033ms | PASS | stable (差 0.00013ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| captureAccessibilityTree | 0.00071ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mockScreencap | 0.00092ms | 0.0032ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| emitUserNotification | 0.00033ms | 0.00046ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createMacAppEnv | 0.01ms | 10ms | PASS |
| simulateUserInteraction | 0.01ms | 10ms | PASS |
| captureAccessibilityTree | 0.02ms | 10ms | PASS |
| mockScreencap | 0.02ms | 10ms | PASS |
| emitUserNotification | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createMacAppEnv | -9856 B | 0 B | 102400 B | yes | PASS |
| simulateUserInteraction | 15128 B | 0 B | 102400 B | yes | PASS |
| captureAccessibilityTree | 4088 B | 0 B | 102400 B | yes | PASS |
| mockScreencap | 632 B | -21280 B | 102400 B | yes | PASS |
| emitUserNotification | 32944 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createMacAppEnv

# Perf Report — createMacAppEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0012ms |
| p99 | 0.0077ms |
| mean | 0.00072ms |
| stdev | 0.0011ms |
| min | 0.00042ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00058ms | -0.00012ms | -21.27% |
| p50 | 0.00050ms | 0.00063ms | -0.00013ms | -20.00% |
| p95 | 0.0012ms | 0.0022ms | -0.0010ms | -47.16% |
| p99 | 0.0077ms | 0.0059ms | +0.0018ms | +30.57% |
| mean | 0.00072ms | 0.00096ms | -0.00024ms | -24.88% |
| min | 0.00042ms | 0.00054ms | -0.00012ms | -22.92% |
| max | 0.01ms | 0.01ms | -0.00025ms | -2.40% |
| total | 0.14ms | 0.19ms | -0.05ms | -24.88% |

### simulateUserInteraction

# Perf Report — simulateUserInteraction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00059ms |
| p99 | 0.0038ms |
| mean | 0.00052ms |
| stdev | 0.00053ms |
| min | 0.00038ms |
| max | 0.0054ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00050ms | -0.00013ms | -25.00% |
| p50 | 0.00042ms | 0.00054ms | -0.00012ms | -23.06% |
| p95 | 0.00059ms | 0.00071ms | -0.00012ms | -16.97% |
| p99 | 0.0038ms | 0.0025ms | +0.0013ms | +52.16% |
| mean | 0.00052ms | 0.00062ms | -0.00010ms | -16.15% |
| min | 0.00038ms | 0.00046ms | -0.000084ms | -18.30% |
| max | 0.0054ms | 0.0048ms | +0.00058ms | +12.06% |
| total | 0.10ms | 0.12ms | -0.02ms | -16.15% |

### captureAccessibilityTree

# Perf Report — captureAccessibilityTree.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00071ms |
| p50 | 0.00075ms |
| p95 | 0.0013ms |
| p99 | 0.0070ms |
| mean | 0.00098ms |
| stdev | 0.0014ms |
| min | 0.00063ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00071ms | 0.00067ms | +0.000042ms | +6.31% |
| p50 | 0.00075ms | 0.00075ms | 0.00ms | 0.00% |
| p95 | 0.0013ms | 0.0015ms | -0.00025ms | -16.00% |
| p99 | 0.0070ms | 0.0059ms | +0.0011ms | +18.82% |
| mean | 0.00098ms | 0.00096ms | +0.000019ms | +1.98% |
| min | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | +0.00013ms | +0.79% |
| total | 0.20ms | 0.19ms | +0.0038ms | +1.98% |

### mockScreencap

# Perf Report — mockScreencap.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00092ms |
| p50 | 0.0024ms |
| p95 | 0.0032ms |
| p99 | 0.0084ms |
| mean | 0.0024ms |
| stdev | 0.0014ms |
| min | 0.00088ms |
| max | 0.02ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00092ms | 0.0025ms | -0.0016ms | -63.93% |
| p50 | 0.0024ms | 0.0036ms | -0.0012ms | -33.71% |
| p95 | 0.0032ms | 0.0042ms | -0.0011ms | -25.06% |
| p99 | 0.0084ms | 0.0073ms | +0.0011ms | +14.64% |
| mean | 0.0024ms | 0.0033ms | -0.00099ms | -29.62% |
| min | 0.00088ms | 0.0025ms | -0.0016ms | -65.00% |
| max | 0.02ms | 0.01ms | +0.0026ms | +19.68% |
| total | 0.47ms | 0.67ms | -0.20ms | -29.62% |

### emitUserNotification

# Perf Report — emitUserNotification.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00046ms |
| p99 | 0.0038ms |
| mean | 0.00046ms |
| stdev | 0.00067ms |
| min | 0.00033ms |
| max | 0.0081ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00046ms | 0.00050ms | -0.000039ms | -7.79% |
| p99 | 0.0038ms | 0.0032ms | +0.00059ms | +18.27% |
| mean | 0.00046ms | 0.00045ms | +0.000016ms | +3.70% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.0081ms | 0.0058ms | +0.0023ms | +40.28% |
| total | 0.09ms | 0.09ms | +0.0033ms | +3.70% |

