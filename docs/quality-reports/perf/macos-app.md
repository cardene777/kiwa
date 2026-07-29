# Perf Suite — macos-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createMacAppEnv | 0.00050ms | 0.0010ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| simulateUserInteraction | 0.00042ms | 0.00068ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureAccessibilityTree | 0.00063ms | 0.0014ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mockScreencap | 0.00095ms | 0.0031ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| emitUserNotification | 0.00033ms | 0.00058ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

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
| createMacAppEnv | -14152 B | 0 B | 102400 B | yes | PASS |
| simulateUserInteraction | 15608 B | 0 B | 102400 B | yes | PASS |
| captureAccessibilityTree | -2496 B | 0 B | 102400 B | yes | PASS |
| mockScreencap | 712 B | -58064 B | 102400 B | yes | PASS |
| emitUserNotification | 47808 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createMacAppEnv

# Perf Report — createMacAppEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00058ms |
| p95 | 0.0010ms |
| p99 | 0.0050ms |
| mean | 0.00074ms |
| stdev | 0.0010ms |
| min | 0.00046ms |
| max | 0.01ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00058ms | -0.000083ms | -14.24% |
| p50 | 0.00058ms | 0.00063ms | -0.000042ms | -6.72% |
| p95 | 0.0010ms | 0.0022ms | -0.0012ms | -54.92% |
| p99 | 0.0050ms | 0.0059ms | -0.00087ms | -14.79% |
| mean | 0.00074ms | 0.00096ms | -0.00022ms | -23.04% |
| min | 0.00046ms | 0.00054ms | -0.000082ms | -15.16% |
| max | 0.01ms | 0.01ms | +0.00050ms | +4.79% |
| total | 0.15ms | 0.19ms | -0.04ms | -23.04% |

### simulateUserInteraction

# Perf Report — simulateUserInteraction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00048ms |
| p95 | 0.00068ms |
| p99 | 0.0027ms |
| mean | 0.00057ms |
| stdev | 0.00051ms |
| min | 0.00042ms |
| max | 0.0058ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00050ms | -0.000083ms | -16.60% |
| p50 | 0.00048ms | 0.00054ms | -0.000062ms | -11.53% |
| p95 | 0.00068ms | 0.00071ms | -0.000031ms | -4.30% |
| p99 | 0.0027ms | 0.0025ms | +0.00025ms | +10.18% |
| mean | 0.00057ms | 0.00062ms | -0.000044ms | -7.06% |
| min | 0.00042ms | 0.00046ms | -0.000043ms | -9.37% |
| max | 0.0058ms | 0.0048ms | +0.00096ms | +19.80% |
| total | 0.11ms | 0.12ms | -0.0087ms | -7.06% |

### captureAccessibilityTree

# Perf Report — captureAccessibilityTree.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00067ms |
| p95 | 0.0014ms |
| p99 | 0.0089ms |
| mean | 0.00094ms |
| stdev | 0.0014ms |
| min | 0.00058ms |
| max | 0.01ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00067ms | -0.000041ms | -6.16% |
| p50 | 0.00067ms | 0.00075ms | -0.000083ms | -11.07% |
| p95 | 0.0014ms | 0.0015ms | -0.00014ms | -9.27% |
| p99 | 0.0089ms | 0.0059ms | +0.0031ms | +52.75% |
| mean | 0.00094ms | 0.00096ms | -0.000020ms | -2.09% |
| min | 0.00058ms | 0.00063ms | -0.000041ms | -6.56% |
| max | 0.01ms | 0.02ms | -0.00096ms | -6.04% |
| total | 0.19ms | 0.19ms | -0.0040ms | -2.09% |

### mockScreencap

# Perf Report — mockScreencap.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00095ms |
| p50 | 0.0023ms |
| p95 | 0.0031ms |
| p99 | 0.0070ms |
| mean | 0.0022ms |
| stdev | 0.0011ms |
| min | 0.00088ms |
| max | 0.01ms |
| total | 0.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00095ms | 0.0025ms | -0.0016ms | -62.47% |
| p50 | 0.0023ms | 0.0036ms | -0.0012ms | -34.86% |
| p95 | 0.0031ms | 0.0042ms | -0.0011ms | -26.95% |
| p99 | 0.0070ms | 0.0073ms | -0.00038ms | -5.12% |
| mean | 0.0022ms | 0.0033ms | -0.0011ms | -33.52% |
| min | 0.00088ms | 0.0025ms | -0.0016ms | -65.00% |
| max | 0.01ms | 0.01ms | -0.00092ms | -6.98% |
| total | 0.44ms | 0.67ms | -0.22ms | -33.52% |

### emitUserNotification

# Perf Report — emitUserNotification.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00058ms |
| p99 | 0.0046ms |
| mean | 0.00048ms |
| stdev | 0.00080ms |
| min | 0.00033ms |
| max | 0.0097ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00058ms | 0.00050ms | +0.000083ms | +16.60% |
| p99 | 0.0046ms | 0.0032ms | +0.0014ms | +44.18% |
| mean | 0.00048ms | 0.00045ms | +0.000034ms | +7.68% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.0097ms | 0.0058ms | +0.0039ms | +67.61% |
| total | 0.10ms | 0.09ms | +0.0068ms | +7.68% |

