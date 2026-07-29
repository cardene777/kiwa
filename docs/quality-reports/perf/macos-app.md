# Perf Suite — macos-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createMacAppEnv | 0.00046ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable (差 0.00012ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| simulateUserInteraction | 0.00038ms | 0.00054ms | 5ms | 0.00033ms | PASS | stable (差 0.00013ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| captureAccessibilityTree | 0.00058ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mockScreencap | 0.00092ms | 0.0041ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| emitUserNotification | 0.00033ms | 0.00077ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +53% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createMacAppEnv | 0.01ms | 10ms | PASS |
| simulateUserInteraction | 0.01ms | 10ms | PASS |
| captureAccessibilityTree | 0.01ms | 10ms | PASS |
| mockScreencap | 0.02ms | 10ms | PASS |
| emitUserNotification | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createMacAppEnv | -11992 B | 0 B | 102400 B | yes | PASS |
| simulateUserInteraction | 14432 B | 0 B | 102400 B | yes | PASS |
| captureAccessibilityTree | -2496 B | 0 B | 102400 B | yes | PASS |
| mockScreencap | 712 B | -19000 B | 102400 B | yes | PASS |
| emitUserNotification | 31872 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createMacAppEnv

# Perf Report — createMacAppEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0011ms |
| p99 | 0.0064ms |
| mean | 0.00071ms |
| stdev | 0.0011ms |
| min | 0.00046ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00058ms | -0.00012ms | -21.44% |
| p50 | 0.00050ms | 0.00063ms | -0.00013ms | -20.00% |
| p95 | 0.0011ms | 0.0022ms | -0.0011ms | -51.04% |
| p99 | 0.0064ms | 0.0059ms | +0.00051ms | +8.70% |
| mean | 0.00071ms | 0.00096ms | -0.00025ms | -26.10% |
| min | 0.00046ms | 0.00054ms | -0.000083ms | -15.34% |
| max | 0.01ms | 0.01ms | +0.0011ms | +10.80% |
| total | 0.14ms | 0.19ms | -0.05ms | -26.10% |

### simulateUserInteraction

# Perf Report — simulateUserInteraction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00054ms |
| p99 | 0.0020ms |
| mean | 0.00049ms |
| stdev | 0.00044ms |
| min | 0.00038ms |
| max | 0.0052ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00050ms | -0.00013ms | -25.00% |
| p50 | 0.00042ms | 0.00054ms | -0.00012ms | -23.06% |
| p95 | 0.00054ms | 0.00071ms | -0.00017ms | -23.61% |
| p99 | 0.0020ms | 0.0025ms | -0.00049ms | -20.05% |
| mean | 0.00049ms | 0.00062ms | -0.00013ms | -20.36% |
| min | 0.00038ms | 0.00046ms | -0.000084ms | -18.30% |
| max | 0.0052ms | 0.0048ms | +0.00038ms | +7.76% |
| total | 0.10ms | 0.12ms | -0.03ms | -20.36% |

### captureAccessibilityTree

# Perf Report — captureAccessibilityTree.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00063ms |
| p95 | 0.0011ms |
| p99 | 0.0052ms |
| mean | 0.00088ms |
| stdev | 0.0012ms |
| min | 0.00058ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00067ms | -0.000082ms | -12.31% |
| p50 | 0.00063ms | 0.00075ms | -0.00013ms | -16.67% |
| p95 | 0.0011ms | 0.0015ms | -0.00046ms | -29.54% |
| p99 | 0.0052ms | 0.0059ms | -0.00066ms | -11.30% |
| mean | 0.00088ms | 0.00096ms | -0.000075ms | -7.85% |
| min | 0.00058ms | 0.00063ms | -0.000042ms | -6.72% |
| max | 0.01ms | 0.02ms | -0.0038ms | -24.14% |
| total | 0.18ms | 0.19ms | -0.02ms | -7.85% |

### mockScreencap

# Perf Report — mockScreencap.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00092ms |
| p50 | 0.0025ms |
| p95 | 0.0041ms |
| p99 | 0.01ms |
| mean | 0.0025ms |
| stdev | 0.0018ms |
| min | 0.00088ms |
| max | 0.01ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00092ms | 0.0025ms | -0.0016ms | -63.93% |
| p50 | 0.0025ms | 0.0036ms | -0.0011ms | -31.40% |
| p95 | 0.0041ms | 0.0042ms | -0.00017ms | -3.95% |
| p99 | 0.01ms | 0.0073ms | +0.0031ms | +42.70% |
| mean | 0.0025ms | 0.0033ms | -0.00080ms | -23.88% |
| min | 0.00088ms | 0.0025ms | -0.0016ms | -65.00% |
| max | 0.01ms | 0.01ms | +0.00038ms | +2.86% |
| total | 0.51ms | 0.67ms | -0.16ms | -23.88% |

### emitUserNotification

# Perf Report — emitUserNotification.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00077ms |
| p99 | 0.0043ms |
| mean | 0.00053ms |
| stdev | 0.00093ms |
| min | 0.00033ms |
| max | 0.0091ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00077ms | 0.00050ms | +0.00027ms | +53.34% |
| p99 | 0.0043ms | 0.0032ms | +0.0011ms | +34.71% |
| mean | 0.00053ms | 0.00045ms | +0.000090ms | +20.21% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.0091ms | 0.0058ms | +0.0033ms | +56.82% |
| total | 0.11ms | 0.09ms | +0.02ms | +20.21% |

