# Perf Suite — rust-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeAxumHandler | 0.00050ms | 0.0041ms | 5ms | 0.00033ms | PASS | stable (p10 -8% (閾値未満)、 p95 +104% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeActixHandler | 0.00046ms | 0.0016ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureTowerMiddleware | 0.00058ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeRocketRoute | 0.00046ms | 0.00087ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeAxumHandler | 0.01ms | 10ms | PASS |
| invokeActixHandler | 0.01ms | 10ms | PASS |
| captureTowerMiddleware | 0.02ms | 10ms | PASS |
| invokeRocketRoute | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeAxumHandler | -13008 B | 0 B | 102400 B | yes | PASS |
| invokeActixHandler | 2168 B | 0 B | 102400 B | yes | PASS |
| captureTowerMiddleware | 616 B | 0 B | 102400 B | yes | PASS |
| invokeRocketRoute | 4656 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeAxumHandler

# Perf Report — invokeAxumHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0041ms |
| p99 | 0.0076ms |
| mean | 0.0010ms |
| stdev | 0.0013ms |
| min | 0.00046ms |
| max | 0.0080ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00054ms | -0.000041ms | -7.58% |
| p50 | 0.00054ms | 0.00054ms | -0.0000010ms | -0.18% |
| p95 | 0.0041ms | 0.0020ms | +0.0021ms | +104.04% |
| p99 | 0.0076ms | 0.0068ms | +0.00078ms | +11.39% |
| mean | 0.0010ms | 0.00083ms | +0.00017ms | +20.00% |
| min | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| max | 0.0080ms | 0.0088ms | -0.00079ms | -8.97% |
| total | 0.20ms | 0.17ms | +0.03ms | +20.00% |

### invokeActixHandler

# Perf Report — invokeActixHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00046ms |
| p95 | 0.0016ms |
| p99 | 0.0031ms |
| mean | 0.00064ms |
| stdev | 0.00079ms |
| min | 0.00042ms |
| max | 0.0081ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p95 | 0.0016ms | 0.0016ms | -0.0000020ms | -0.13% |
| p99 | 0.0031ms | 0.0033ms | -0.00014ms | -4.25% |
| mean | 0.00064ms | 0.00060ms | +0.000038ms | +6.29% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.0081ms | 0.0052ms | +0.0029ms | +55.17% |
| total | 0.13ms | 0.12ms | +0.0076ms | +6.29% |

### captureTowerMiddleware

# Perf Report — captureTowerMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00071ms |
| p95 | 0.0013ms |
| p99 | 0.0063ms |
| mean | 0.00089ms |
| stdev | 0.0011ms |
| min | 0.00050ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00058ms | 0.00ms | 0.00% |
| p50 | 0.00071ms | 0.00069ms | +0.000021ms | +2.98% |
| p95 | 0.0013ms | 0.0014ms | -0.00012ms | -8.13% |
| p99 | 0.0063ms | 0.0061ms | +0.00023ms | +3.83% |
| mean | 0.00089ms | 0.00088ms | +0.000014ms | +1.62% |
| min | 0.00050ms | 0.00054ms | -0.000041ms | -7.58% |
| max | 0.01ms | 0.01ms | +0.00033ms | +2.96% |
| total | 0.18ms | 0.18ms | +0.0028ms | +1.62% |

### invokeRocketRoute

# Perf Report — invokeRocketRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.00087ms |
| p99 | 0.0029ms |
| mean | 0.00061ms |
| stdev | 0.00058ms |
| min | 0.00046ms |
| max | 0.0067ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p50 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p95 | 0.00087ms | 0.00086ms | +0.0000083ms | +0.97% |
| p99 | 0.0029ms | 0.0028ms | +0.00017ms | +6.04% |
| mean | 0.00061ms | 0.00062ms | -0.0000069ms | -1.11% |
| min | 0.00046ms | 0.00046ms | -0.0000010ms | -0.22% |
| max | 0.0067ms | 0.0048ms | +0.0019ms | +38.82% |
| total | 0.12ms | 0.12ms | -0.0014ms | -1.11% |

