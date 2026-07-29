# Perf Suite — rust-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeAxumHandler | 0.00050ms | 0.0020ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeActixHandler | 0.00046ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureTowerMiddleware | 0.00058ms | 0.0014ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeRocketRoute | 0.00050ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +38% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeAxumHandler | 0.01ms | 10ms | PASS |
| invokeActixHandler | 0.01ms | 10ms | PASS |
| captureTowerMiddleware | 0.01ms | 10ms | PASS |
| invokeRocketRoute | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeAxumHandler | -8272 B | 0 B | 102400 B | yes | PASS |
| invokeActixHandler | 2600 B | 0 B | 102400 B | yes | PASS |
| captureTowerMiddleware | 616 B | 0 B | 102400 B | yes | PASS |
| invokeRocketRoute | 4584 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeAxumHandler

# Perf Report — invokeAxumHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0020ms |
| p99 | 0.0069ms |
| mean | 0.00082ms |
| stdev | 0.0011ms |
| min | 0.00050ms |
| max | 0.0096ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00054ms | -0.000041ms | -7.58% |
| p50 | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| p95 | 0.0020ms | 0.0020ms | -0.000044ms | -2.20% |
| p99 | 0.0069ms | 0.0068ms | +0.000077ms | +1.13% |
| mean | 0.00082ms | 0.00083ms | -0.000012ms | -1.48% |
| min | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| max | 0.0096ms | 0.0088ms | +0.00075ms | +8.48% |
| total | 0.16ms | 0.17ms | -0.0025ms | -1.48% |

### invokeActixHandler

# Perf Report — invokeActixHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00046ms |
| p95 | 0.0015ms |
| p99 | 0.0029ms |
| mean | 0.00063ms |
| stdev | 0.00073ms |
| min | 0.00042ms |
| max | 0.0067ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p95 | 0.0015ms | 0.0016ms | -0.000042ms | -2.64% |
| p99 | 0.0029ms | 0.0033ms | -0.00034ms | -10.54% |
| mean | 0.00063ms | 0.00060ms | +0.000027ms | +4.46% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.0067ms | 0.0052ms | +0.0015ms | +28.78% |
| total | 0.13ms | 0.12ms | +0.0054ms | +4.46% |

### captureTowerMiddleware

# Perf Report — captureTowerMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00071ms |
| p95 | 0.0014ms |
| p99 | 0.0069ms |
| mean | 0.00093ms |
| stdev | 0.0013ms |
| min | 0.00054ms |
| max | 0.01ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00058ms | 0.00ms | 0.00% |
| p50 | 0.00071ms | 0.00069ms | +0.000021ms | +2.98% |
| p95 | 0.0014ms | 0.0014ms | -0.000085ms | -5.87% |
| p99 | 0.0069ms | 0.0061ms | +0.00082ms | +13.45% |
| mean | 0.00093ms | 0.00088ms | +0.000052ms | +5.98% |
| min | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00079ms | +7.03% |
| total | 0.19ms | 0.18ms | +0.01ms | +5.98% |

### invokeRocketRoute

# Perf Report — invokeRocketRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00050ms |
| p95 | 0.0012ms |
| p99 | 0.0031ms |
| mean | 0.00063ms |
| stdev | 0.00055ms |
| min | 0.00046ms |
| max | 0.0059ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p95 | 0.0012ms | 0.00086ms | +0.00032ms | +37.70% |
| p99 | 0.0031ms | 0.0028ms | +0.00037ms | +13.55% |
| mean | 0.00063ms | 0.00062ms | +0.0000094ms | +1.52% |
| min | 0.00046ms | 0.00046ms | -0.0000010ms | -0.22% |
| max | 0.0059ms | 0.0048ms | +0.0011ms | +22.43% |
| total | 0.13ms | 0.12ms | +0.0019ms | +1.52% |

