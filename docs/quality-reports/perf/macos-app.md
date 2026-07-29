# Perf Suite — macos-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createMacAppEnv | 0.00046ms | 0.0010ms | 5ms | 0.00033ms | PASS | stable (差 0.00012ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| simulateUserInteraction | 0.00038ms | 0.00059ms | 5ms | 0.00033ms | PASS | stable (差 0.00013ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| captureAccessibilityTree | 0.00083ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable (差 0.00017ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| mockScreencap | 0.0025ms | 0.0042ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| emitUserNotification | 0.00038ms | 0.00046ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createMacAppEnv | 0.02ms | 10ms | PASS |
| simulateUserInteraction | 0.01ms | 10ms | PASS |
| captureAccessibilityTree | 0.01ms | 10ms | PASS |
| mockScreencap | 0.03ms | 10ms | PASS |
| emitUserNotification | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createMacAppEnv | -13608 B | 0 B | 102400 B | yes | PASS |
| simulateUserInteraction | 15144 B | 0 B | 102400 B | yes | PASS |
| captureAccessibilityTree | 13448 B | 0 B | 102400 B | yes | PASS |
| mockScreencap | 2264 B | -8816 B | 102400 B | yes | PASS |
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
| p95 | 0.0010ms |
| p99 | 0.0058ms |
| mean | 0.00071ms |
| stdev | 0.0010ms |
| min | 0.00046ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00058ms | -0.00012ms | -21.27% |
| p50 | 0.00050ms | 0.00063ms | -0.00013ms | -20.00% |
| p95 | 0.0010ms | 0.0022ms | -0.0012ms | -52.94% |
| p99 | 0.0058ms | 0.0059ms | -0.000097ms | -1.65% |
| mean | 0.00071ms | 0.00096ms | -0.00025ms | -26.18% |
| min | 0.00046ms | 0.00054ms | -0.000083ms | -15.34% |
| max | 0.01ms | 0.01ms | -0.00029ms | -2.80% |
| total | 0.14ms | 0.19ms | -0.05ms | -26.18% |

### simulateUserInteraction

# Perf Report — simulateUserInteraction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00059ms |
| p99 | 0.0028ms |
| mean | 0.00051ms |
| stdev | 0.00051ms |
| min | 0.00038ms |
| max | 0.0058ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00050ms | -0.00013ms | -25.00% |
| p50 | 0.00042ms | 0.00054ms | -0.00012ms | -23.06% |
| p95 | 0.00059ms | 0.00071ms | -0.00013ms | -17.71% |
| p99 | 0.0028ms | 0.0025ms | +0.00029ms | +11.74% |
| mean | 0.00051ms | 0.00062ms | -0.00011ms | -17.12% |
| min | 0.00038ms | 0.00046ms | -0.000084ms | -18.30% |
| max | 0.0058ms | 0.0048ms | +0.00096ms | +19.82% |
| total | 0.10ms | 0.12ms | -0.02ms | -17.12% |

### captureAccessibilityTree

# Perf Report — captureAccessibilityTree.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.00083ms |
| p95 | 0.0013ms |
| p99 | 0.0057ms |
| mean | 0.0010ms |
| stdev | 0.00096ms |
| min | 0.00079ms |
| max | 0.0095ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00083ms | 0.00067ms | +0.00017ms | +25.08% |
| p50 | 0.00083ms | 0.00075ms | +0.000084ms | +11.20% |
| p95 | 0.0013ms | 0.0015ms | -0.00029ms | -18.86% |
| p99 | 0.0057ms | 0.0059ms | -0.00015ms | -2.62% |
| mean | 0.0010ms | 0.00096ms | +0.000062ms | +6.44% |
| min | 0.00079ms | 0.00063ms | +0.00017ms | +26.72% |
| max | 0.0095ms | 0.02ms | -0.0064ms | -40.42% |
| total | 0.20ms | 0.19ms | +0.01ms | +6.44% |

### mockScreencap

# Perf Report — mockScreencap.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0025ms |
| p50 | 0.0025ms |
| p95 | 0.0042ms |
| p99 | 0.0072ms |
| mean | 0.0028ms |
| stdev | 0.0011ms |
| min | 0.0024ms |
| max | 0.02ms |
| total | 0.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0025ms | -0.000084ms | -3.30% |
| p50 | 0.0025ms | 0.0036ms | -0.0011ms | -30.23% |
| p95 | 0.0042ms | 0.0042ms | -0.000059ms | -1.39% |
| p99 | 0.0072ms | 0.0073ms | -0.00012ms | -1.70% |
| mean | 0.0028ms | 0.0033ms | -0.00050ms | -15.10% |
| min | 0.0024ms | 0.0025ms | -0.000083ms | -3.32% |
| max | 0.02ms | 0.01ms | +0.0022ms | +16.50% |
| total | 0.57ms | 0.67ms | -0.10ms | -15.10% |

### emitUserNotification

# Perf Report — emitUserNotification.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00038ms |
| p95 | 0.00046ms |
| p99 | 0.0058ms |
| mean | 0.00070ms |
| stdev | 0.0024ms |
| min | 0.00033ms |
| max | 0.03ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00033ms | +0.000042ms | +12.61% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00046ms | 0.00050ms | -0.000041ms | -8.20% |
| p99 | 0.0058ms | 0.0032ms | +0.0026ms | +79.85% |
| mean | 0.00070ms | 0.00045ms | +0.00025ms | +56.27% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.0058ms | +0.02ms | +396.37% |
| total | 0.14ms | 0.09ms | +0.05ms | +56.27% |

