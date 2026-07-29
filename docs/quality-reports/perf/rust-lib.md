# Perf Suite — rust-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeAxumHandler | 0.00050ms | 0.0022ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeActixHandler | 0.00046ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureTowerMiddleware | 0.00054ms | 0.0020ms | 5ms | 0.00033ms | PASS | stable (p10 -7% (閾値未満)、 p95 +40% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeRocketRoute | 0.00050ms | 0.00099ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeAxumHandler | 0.01ms | 10ms | PASS |
| invokeActixHandler | 0.01ms | 10ms | PASS |
| captureTowerMiddleware | 0.02ms | 10ms | PASS |
| invokeRocketRoute | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeAxumHandler | -12544 B | 0 B | 102400 B | yes | PASS |
| invokeActixHandler | 2072 B | 0 B | 102400 B | yes | PASS |
| captureTowerMiddleware | 616 B | 0 B | 102400 B | yes | PASS |
| invokeRocketRoute | 17312 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeAxumHandler

# Perf Report — invokeAxumHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0022ms |
| p99 | 0.0050ms |
| mean | 0.00086ms |
| stdev | 0.00090ms |
| min | 0.00046ms |
| max | 0.0071ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00054ms | -0.000041ms | -7.58% |
| p50 | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| p95 | 0.0022ms | 0.0020ms | +0.00021ms | +10.44% |
| p99 | 0.0050ms | 0.0068ms | -0.0018ms | -26.45% |
| mean | 0.00086ms | 0.00083ms | +0.000032ms | +3.89% |
| min | 0.00046ms | 0.00050ms | -0.000041ms | -8.20% |
| max | 0.0071ms | 0.0088ms | -0.0018ms | -19.82% |
| total | 0.17ms | 0.17ms | +0.0065ms | +3.89% |

### invokeActixHandler

# Perf Report — invokeActixHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0015ms |
| p99 | 0.0033ms |
| mean | 0.00063ms |
| stdev | 0.00065ms |
| min | 0.00042ms |
| max | 0.0066ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00050ms | 0.00046ms | +0.000041ms | +8.93% |
| p95 | 0.0015ms | 0.0016ms | -0.000042ms | -2.65% |
| p99 | 0.0033ms | 0.0033ms | +0.000052ms | +1.58% |
| mean | 0.00063ms | 0.00060ms | +0.000030ms | +4.94% |
| min | 0.00042ms | 0.00042ms | +0.0000010ms | +0.24% |
| max | 0.0066ms | 0.0052ms | +0.0014ms | +26.38% |
| total | 0.13ms | 0.12ms | +0.0060ms | +4.94% |

### captureTowerMiddleware

# Perf Report — captureTowerMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00067ms |
| p95 | 0.0020ms |
| p99 | 0.0090ms |
| mean | 0.00098ms |
| stdev | 0.0014ms |
| min | 0.00054ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00058ms | -0.000041ms | -7.03% |
| p50 | 0.00067ms | 0.00069ms | -0.000021ms | -2.98% |
| p95 | 0.0020ms | 0.0014ms | +0.00058ms | +40.29% |
| p99 | 0.0090ms | 0.0061ms | +0.0029ms | +48.10% |
| mean | 0.00098ms | 0.00088ms | +0.00010ms | +11.87% |
| min | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.0020ms | +18.15% |
| total | 0.20ms | 0.18ms | +0.02ms | +11.87% |

### invokeRocketRoute

# Perf Report — invokeRocketRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.00099ms |
| p99 | 0.0033ms |
| mean | 0.00065ms |
| stdev | 0.00054ms |
| min | 0.00050ms |
| max | 0.0053ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00050ms | +0.000042ms | +8.40% |
| p95 | 0.00099ms | 0.00086ms | +0.00013ms | +14.81% |
| p99 | 0.0033ms | 0.0028ms | +0.00054ms | +19.63% |
| mean | 0.00065ms | 0.00062ms | +0.000032ms | +5.20% |
| min | 0.00050ms | 0.00046ms | +0.000041ms | +8.93% |
| max | 0.0053ms | 0.0048ms | +0.00042ms | +8.63% |
| total | 0.13ms | 0.12ms | +0.0064ms | +5.20% |

