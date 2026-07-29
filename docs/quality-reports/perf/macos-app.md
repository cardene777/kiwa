# Perf Suite — macos-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createMacAppEnv | 0.00046ms | 0.0023ms | 5ms | 0.00033ms | PASS | stable (差 0.00012ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| simulateUserInteraction | 0.00042ms | 0.00059ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureAccessibilityTree | 0.00063ms | 0.0014ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mockScreencap | 0.00096ms | 0.0034ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| emitUserNotification | 0.00033ms | 0.00055ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createMacAppEnv | 0.02ms | 10ms | PASS |
| simulateUserInteraction | 0.01ms | 10ms | PASS |
| captureAccessibilityTree | 0.02ms | 10ms | PASS |
| mockScreencap | 0.02ms | 10ms | PASS |
| emitUserNotification | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createMacAppEnv | -17704 B | 0 B | 102400 B | yes | PASS |
| simulateUserInteraction | 12192 B | 0 B | 102400 B | yes | PASS |
| captureAccessibilityTree | -3520 B | 0 B | 102400 B | yes | PASS |
| mockScreencap | 712 B | -18848 B | 102400 B | yes | PASS |
| emitUserNotification | 31312 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createMacAppEnv

# Perf Report — createMacAppEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00054ms |
| p95 | 0.0023ms |
| p99 | 0.0049ms |
| mean | 0.00083ms |
| stdev | 0.0010ms |
| min | 0.00046ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00058ms | -0.00012ms | -21.27% |
| p50 | 0.00054ms | 0.00063ms | -0.000084ms | -13.44% |
| p95 | 0.0023ms | 0.0022ms | +0.00012ms | +5.45% |
| p99 | 0.0049ms | 0.0059ms | -0.00097ms | -16.41% |
| mean | 0.00083ms | 0.00096ms | -0.00013ms | -13.68% |
| min | 0.00046ms | 0.00054ms | -0.000083ms | -15.34% |
| max | 0.01ms | 0.01ms | -0.00033ms | -3.21% |
| total | 0.17ms | 0.19ms | -0.03ms | -13.68% |

### simulateUserInteraction

# Perf Report — simulateUserInteraction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.00059ms |
| p99 | 0.0036ms |
| mean | 0.00054ms |
| stdev | 0.00054ms |
| min | 0.00038ms |
| max | 0.0057ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00050ms | -0.000084ms | -16.80% |
| p50 | 0.00042ms | 0.00054ms | -0.00012ms | -23.06% |
| p95 | 0.00059ms | 0.00071ms | -0.00012ms | -16.68% |
| p99 | 0.0036ms | 0.0025ms | +0.0012ms | +47.07% |
| mean | 0.00054ms | 0.00062ms | -0.000079ms | -12.74% |
| min | 0.00038ms | 0.00046ms | -0.000084ms | -18.30% |
| max | 0.0057ms | 0.0048ms | +0.00092ms | +18.95% |
| total | 0.11ms | 0.12ms | -0.02ms | -12.74% |

### captureAccessibilityTree

# Perf Report — captureAccessibilityTree.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00067ms |
| p95 | 0.0014ms |
| p99 | 0.0061ms |
| mean | 0.00091ms |
| stdev | 0.0013ms |
| min | 0.00054ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00067ms | -0.000041ms | -6.16% |
| p50 | 0.00067ms | 0.00075ms | -0.000083ms | -11.07% |
| p95 | 0.0014ms | 0.0015ms | -0.00016ms | -10.22% |
| p99 | 0.0061ms | 0.0059ms | +0.00027ms | +4.69% |
| mean | 0.00091ms | 0.00096ms | -0.000049ms | -5.13% |
| min | 0.00054ms | 0.00063ms | -0.000084ms | -13.44% |
| max | 0.01ms | 0.02ms | -0.0024ms | -14.96% |
| total | 0.18ms | 0.19ms | -0.0098ms | -5.13% |

### mockScreencap

# Perf Report — mockScreencap.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00096ms |
| p50 | 0.0025ms |
| p95 | 0.0034ms |
| p99 | 0.0088ms |
| mean | 0.0025ms |
| stdev | 0.0012ms |
| min | 0.00088ms |
| max | 0.01ms |
| total | 0.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00096ms | 0.0025ms | -0.0016ms | -62.28% |
| p50 | 0.0025ms | 0.0036ms | -0.0011ms | -31.37% |
| p95 | 0.0034ms | 0.0042ms | -0.00087ms | -20.51% |
| p99 | 0.0088ms | 0.0073ms | +0.0014ms | +19.22% |
| mean | 0.0025ms | 0.0033ms | -0.00088ms | -26.29% |
| min | 0.00088ms | 0.0025ms | -0.0016ms | -65.00% |
| max | 0.01ms | 0.01ms | -0.00092ms | -6.98% |
| total | 0.49ms | 0.67ms | -0.18ms | -26.29% |

### emitUserNotification

# Perf Report — emitUserNotification.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00055ms |
| p99 | 0.0042ms |
| mean | 0.00047ms |
| stdev | 0.00074ms |
| min | 0.00029ms |
| max | 0.0090ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00055ms | 0.00050ms | +0.000045ms | +9.04% |
| p99 | 0.0042ms | 0.0032ms | +0.0010ms | +31.13% |
| mean | 0.00047ms | 0.00045ms | +0.000022ms | +4.96% |
| min | 0.00029ms | 0.00033ms | -0.000041ms | -12.31% |
| max | 0.0090ms | 0.0058ms | +0.0032ms | +56.11% |
| total | 0.09ms | 0.09ms | +0.0044ms | +4.96% |

