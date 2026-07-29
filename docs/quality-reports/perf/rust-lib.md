# Perf Suite — rust-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeAxumHandler | 0.00050ms | 0.0019ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeActixHandler | 0.00046ms | 0.0016ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureTowerMiddleware | 0.00058ms | 0.0018ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +22% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeRocketRoute | 0.00050ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +56% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

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
| invokeAxumHandler | -12968 B | 0 B | 102400 B | yes | PASS |
| invokeActixHandler | 2696 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.0019ms |
| p99 | 0.0052ms |
| mean | 0.00077ms |
| stdev | 0.00086ms |
| min | 0.00050ms |
| max | 0.0073ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00054ms | -0.000041ms | -7.58% |
| p50 | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| p95 | 0.0019ms | 0.0020ms | -0.00012ms | -6.04% |
| p99 | 0.0052ms | 0.0068ms | -0.0016ms | -23.44% |
| mean | 0.00077ms | 0.00083ms | -0.000062ms | -7.47% |
| min | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| max | 0.0073ms | 0.0088ms | -0.0015ms | -17.46% |
| total | 0.15ms | 0.17ms | -0.01ms | -7.47% |

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
| mean | 0.00061ms |
| stdev | 0.00061ms |
| min | 0.00042ms |
| max | 0.0063ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p95 | 0.0016ms | 0.0016ms | -9.5e-7ms | -0.06% |
| p99 | 0.0031ms | 0.0033ms | -0.00020ms | -6.11% |
| mean | 0.00061ms | 0.00060ms | +0.000011ms | +1.90% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.0063ms | 0.0052ms | +0.0010ms | +19.98% |
| total | 0.12ms | 0.12ms | +0.0023ms | +1.90% |

### captureTowerMiddleware

# Perf Report — captureTowerMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00067ms |
| p95 | 0.0018ms |
| p99 | 0.0086ms |
| mean | 0.00097ms |
| stdev | 0.0016ms |
| min | 0.00054ms |
| max | 0.01ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00058ms | 0.00ms | 0.00% |
| p50 | 0.00067ms | 0.00069ms | -0.000021ms | -2.98% |
| p95 | 0.0018ms | 0.0014ms | +0.00032ms | +22.03% |
| p99 | 0.0086ms | 0.0061ms | +0.0025ms | +41.57% |
| mean | 0.00097ms | 0.00088ms | +0.000094ms | +10.74% |
| min | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.0032ms | +28.52% |
| total | 0.19ms | 0.18ms | +0.02ms | +10.74% |

### invokeRocketRoute

# Perf Report — invokeRocketRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00050ms |
| p95 | 0.0013ms |
| p99 | 0.0032ms |
| mean | 0.00063ms |
| stdev | 0.00054ms |
| min | 0.00046ms |
| max | 0.0055ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p95 | 0.0013ms | 0.00086ms | +0.00048ms | +56.33% |
| p99 | 0.0032ms | 0.0028ms | +0.00046ms | +16.58% |
| mean | 0.00063ms | 0.00062ms | +0.000015ms | +2.36% |
| min | 0.00046ms | 0.00046ms | -0.0000010ms | -0.22% |
| max | 0.0055ms | 0.0048ms | +0.00071ms | +14.67% |
| total | 0.13ms | 0.12ms | +0.0029ms | +2.36% |

