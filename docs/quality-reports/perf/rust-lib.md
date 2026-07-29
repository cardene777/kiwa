# Perf Suite — rust-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeAxumHandler | 0.00054ms | 0.0025ms | 5ms | 0.00033ms | PASS | stable (p10 +0% (閾値未満)、 p95 +26% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeActixHandler | 0.00050ms | 0.0018ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureTowerMiddleware | 0.00063ms | 0.0017ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeRocketRoute | 0.00054ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable (p10 +8% (閾値未満)、 p95 +71% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeAxumHandler | 0.02ms | 10ms | PASS |
| invokeActixHandler | 0.01ms | 10ms | PASS |
| captureTowerMiddleware | 0.02ms | 10ms | PASS |
| invokeRocketRoute | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeAxumHandler | -8840 B | 0 B | 102400 B | yes | PASS |
| invokeActixHandler | 2600 B | 0 B | 102400 B | yes | PASS |
| captureTowerMiddleware | 2656 B | 0 B | 102400 B | yes | PASS |
| invokeRocketRoute | 352 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeAxumHandler

# Perf Report — invokeAxumHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0025ms |
| p99 | 0.0080ms |
| mean | 0.00092ms |
| stdev | 0.0012ms |
| min | 0.00054ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00054ms | +0.0000010ms | +0.18% |
| p50 | 0.00058ms | 0.00054ms | +0.000042ms | +7.75% |
| p95 | 0.0025ms | 0.0020ms | +0.00052ms | +25.81% |
| p99 | 0.0080ms | 0.0068ms | +0.0012ms | +16.91% |
| mean | 0.00092ms | 0.00083ms | +0.000089ms | +10.68% |
| min | 0.00054ms | 0.00050ms | +0.000041ms | +8.20% |
| max | 0.01ms | 0.0088ms | +0.0018ms | +20.74% |
| total | 0.18ms | 0.17ms | +0.02ms | +10.68% |

### invokeActixHandler

# Perf Report — invokeActixHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0018ms |
| p99 | 0.0034ms |
| mean | 0.00069ms |
| stdev | 0.00068ms |
| min | 0.00046ms |
| max | 0.0067ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00046ms | +0.000042ms | +9.17% |
| p50 | 0.00054ms | 0.00046ms | +0.000082ms | +17.86% |
| p95 | 0.0018ms | 0.0016ms | +0.00025ms | +15.57% |
| p99 | 0.0034ms | 0.0033ms | +0.00013ms | +4.09% |
| mean | 0.00069ms | 0.00060ms | +0.000081ms | +13.50% |
| min | 0.00046ms | 0.00042ms | +0.000042ms | +10.10% |
| max | 0.0067ms | 0.0052ms | +0.0015ms | +27.97% |
| total | 0.14ms | 0.12ms | +0.02ms | +13.50% |

### captureTowerMiddleware

# Perf Report — captureTowerMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00075ms |
| p95 | 0.0017ms |
| p99 | 0.0094ms |
| mean | 0.0010ms |
| stdev | 0.0017ms |
| min | 0.00058ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00058ms | +0.000042ms | +7.20% |
| p50 | 0.00075ms | 0.00069ms | +0.000063ms | +9.09% |
| p95 | 0.0017ms | 0.0014ms | +0.00025ms | +17.43% |
| p99 | 0.0094ms | 0.0061ms | +0.0034ms | +55.86% |
| mean | 0.0010ms | 0.00088ms | +0.00016ms | +18.42% |
| min | 0.00058ms | 0.00054ms | +0.000042ms | +7.76% |
| max | 0.02ms | 0.01ms | +0.0050ms | +44.44% |
| total | 0.21ms | 0.18ms | +0.03ms | +18.42% |

### invokeRocketRoute

# Perf Report — invokeRocketRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00054ms |
| p95 | 0.0015ms |
| p99 | 0.0034ms |
| mean | 0.00069ms |
| stdev | 0.00059ms |
| min | 0.00054ms |
| max | 0.0058ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00050ms | +0.000041ms | +8.20% |
| p50 | 0.00054ms | 0.00050ms | +0.000042ms | +8.40% |
| p95 | 0.0015ms | 0.00086ms | +0.00061ms | +71.49% |
| p99 | 0.0034ms | 0.0028ms | +0.00067ms | +24.20% |
| mean | 0.00069ms | 0.00062ms | +0.000072ms | +11.70% |
| min | 0.00054ms | 0.00046ms | +0.000082ms | +17.86% |
| max | 0.0058ms | 0.0048ms | +0.00096ms | +19.84% |
| total | 0.14ms | 0.12ms | +0.01ms | +11.70% |

