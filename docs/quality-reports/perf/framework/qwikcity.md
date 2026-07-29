# Perf Suite — qwikcity

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeRouteLoader | 0.00071ms | 0.0026ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeRouteAction | 0.00067ms | 0.0020ms | 5ms | 0.00033ms | PASS | stable (p10 +0% (閾値未満)、 p95 +63% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRouteLoader | 0.02ms | 10ms | PASS |
| invokeRouteAction | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRouteLoader | -25384 B | 0 B | 102400 B | yes | PASS |
| invokeRouteAction | -79240 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeRouteLoader

# Perf Report — invokeRouteLoader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00071ms |
| p50 | 0.00079ms |
| p95 | 0.0026ms |
| p99 | 0.0072ms |
| mean | 0.0012ms |
| stdev | 0.0014ms |
| min | 0.00071ms |
| max | 0.01ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00071ms | 0.00075ms | -0.000041ms | -5.47% |
| p50 | 0.00079ms | 0.00079ms | 0.00ms | 0.00% |
| p95 | 0.0026ms | 0.0034ms | -0.00079ms | -23.25% |
| p99 | 0.0072ms | 0.01ms | -0.0028ms | -28.44% |
| mean | 0.0012ms | 0.0014ms | -0.00017ms | -12.56% |
| min | 0.00071ms | 0.00075ms | -0.000042ms | -5.60% |
| max | 0.01ms | 0.01ms | -0.0010ms | -7.11% |
| total | 0.24ms | 0.27ms | -0.03ms | -12.56% |

### invokeRouteAction

# Perf Report — invokeRouteAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00075ms |
| p95 | 0.0020ms |
| p99 | 0.0086ms |
| mean | 0.0010ms |
| stdev | 0.0013ms |
| min | 0.00063ms |
| max | 0.01ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00067ms | 0.00067ms | +0.0000010ms | +0.15% |
| p50 | 0.00075ms | 0.00073ms | +0.000021ms | +2.81% |
| p95 | 0.0020ms | 0.0012ms | +0.00078ms | +63.47% |
| p99 | 0.0086ms | 0.0062ms | +0.0024ms | +37.67% |
| mean | 0.0010ms | 0.00095ms | +0.000089ms | +9.39% |
| min | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.0020ms | +18.49% |
| total | 0.21ms | 0.19ms | +0.02ms | +9.39% |

