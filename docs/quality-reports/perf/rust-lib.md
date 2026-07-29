# Perf Suite — rust-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeAxumHandler | 0.00067ms | 0.0022ms | 5ms | 0.00042ms | PASS | stable (差 0.00013ms が下限 0.00042ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| invokeActixHandler | 0.00054ms | 0.0019ms | 5ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureTowerMiddleware | 0.00058ms | 0.0022ms | 5ms | 0.00042ms | PASS | stable (p10 0% (閾値未満)、 p95 +54% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeRocketRoute | 0.00050ms | 0.0012ms | 5ms | 0.00042ms | PASS | stable (p10 0% (閾値未満)、 p95 +38% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeAxumHandler | 0.01ms | 10ms | PASS |
| invokeActixHandler | 0.01ms | 10ms | PASS |
| captureTowerMiddleware | 0.01ms | 10ms | PASS |
| invokeRocketRoute | 0.04ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeAxumHandler | -9520 B | -60638 B | 102400 B | yes | PASS |
| invokeActixHandler | 6424 B | 0 B | 102400 B | yes | PASS |
| captureTowerMiddleware | 2656 B | 0 B | 102400 B | yes | PASS |
| invokeRocketRoute | 4696 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeAxumHandler

# Perf Report — invokeAxumHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00071ms |
| p95 | 0.0022ms |
| p99 | 0.0056ms |
| mean | 0.00097ms |
| stdev | 0.0010ms |
| min | 0.00063ms |
| max | 0.0090ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00067ms | 0.00054ms | +0.00013ms | +23.11% |
| p50 | 0.00071ms | 0.00054ms | +0.00017ms | +30.63% |
| p95 | 0.0022ms | 0.0020ms | +0.00017ms | +8.55% |
| p99 | 0.0056ms | 0.0068ms | -0.0012ms | -18.14% |
| mean | 0.00097ms | 0.00083ms | +0.00014ms | +16.84% |
| min | 0.00063ms | 0.00050ms | +0.00013ms | +25.00% |
| max | 0.0090ms | 0.0088ms | +0.00013ms | +1.41% |
| total | 0.19ms | 0.17ms | +0.03ms | +16.84% |

### invokeActixHandler

# Perf Report — invokeActixHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0019ms |
| p99 | 0.0035ms |
| mean | 0.00072ms |
| stdev | 0.00069ms |
| min | 0.00050ms |
| max | 0.0069ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00046ms | +0.000083ms | +18.12% |
| p50 | 0.00058ms | 0.00046ms | +0.00012ms | +27.02% |
| p95 | 0.0019ms | 0.0016ms | +0.00030ms | +18.61% |
| p99 | 0.0035ms | 0.0033ms | +0.00026ms | +7.88% |
| mean | 0.00072ms | 0.00060ms | +0.00012ms | +19.91% |
| min | 0.00050ms | 0.00042ms | +0.000084ms | +20.19% |
| max | 0.0069ms | 0.0052ms | +0.0017ms | +31.98% |
| total | 0.14ms | 0.12ms | +0.02ms | +19.91% |

### captureTowerMiddleware

# Perf Report — captureTowerMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00067ms |
| p95 | 0.0022ms |
| p99 | 0.0094ms |
| mean | 0.0015ms |
| stdev | 0.0080ms |
| min | 0.00054ms |
| max | 0.11ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00058ms | 0.00ms | 0.00% |
| p50 | 0.00067ms | 0.00069ms | -0.000021ms | -2.98% |
| p95 | 0.0022ms | 0.0014ms | +0.00078ms | +54.06% |
| p99 | 0.0094ms | 0.0061ms | +0.0033ms | +54.53% |
| mean | 0.0015ms | 0.00088ms | +0.00063ms | +72.32% |
| min | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| max | 0.11ms | 0.01ms | +0.10ms | +901.85% |
| total | 0.30ms | 0.18ms | +0.13ms | +72.32% |

### invokeRocketRoute

# Perf Report — invokeRocketRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0012ms |
| p99 | 0.0035ms |
| mean | 0.00065ms |
| stdev | 0.00063ms |
| min | 0.00050ms |
| max | 0.0070ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00050ms | +0.000041ms | +8.20% |
| p95 | 0.0012ms | 0.00086ms | +0.00033ms | +38.19% |
| p99 | 0.0035ms | 0.0028ms | +0.00071ms | +25.66% |
| mean | 0.00065ms | 0.00062ms | +0.000035ms | +5.70% |
| min | 0.00050ms | 0.00046ms | +0.000041ms | +8.93% |
| max | 0.0070ms | 0.0048ms | +0.0022ms | +45.69% |
| total | 0.13ms | 0.12ms | +0.0070ms | +5.70% |

