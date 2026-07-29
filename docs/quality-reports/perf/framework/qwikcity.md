# Perf Suite — qwikcity

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeRouteLoader | 0.00079ms | 0.0035ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeRouteAction | 0.00067ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRouteLoader | 0.02ms | 10ms | PASS |
| invokeRouteAction | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRouteLoader | -18048 B | 0 B | 102400 B | yes | PASS |
| invokeRouteAction | -195680 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeRouteLoader

# Perf Report — invokeRouteLoader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00079ms |
| p50 | 0.0010ms |
| p95 | 0.0035ms |
| p99 | 0.01ms |
| mean | 0.0015ms |
| stdev | 0.0023ms |
| min | 0.00075ms |
| max | 0.02ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00079ms | 0.00075ms | +0.000041ms | +5.47% |
| p50 | 0.0010ms | 0.00079ms | +0.00023ms | +28.85% |
| p95 | 0.0035ms | 0.0034ms | +0.000069ms | +2.04% |
| p99 | 0.01ms | 0.01ms | +0.0016ms | +16.43% |
| mean | 0.0015ms | 0.0014ms | +0.00014ms | +10.34% |
| min | 0.00075ms | 0.00075ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0090ms | +63.81% |
| total | 0.30ms | 0.27ms | +0.03ms | +10.34% |

### invokeRouteAction

# Perf Report — invokeRouteAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00071ms |
| p95 | 0.0012ms |
| p99 | 0.0060ms |
| mean | 0.00095ms |
| stdev | 0.0012ms |
| min | 0.00063ms |
| max | 0.01ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00067ms | 0.00067ms | 0.00ms | 0.00% |
| p50 | 0.00071ms | 0.00073ms | -0.000021ms | -2.88% |
| p95 | 0.0012ms | 0.0012ms | -0.000019ms | -1.52% |
| p99 | 0.0060ms | 0.0062ms | -0.00029ms | -4.65% |
| mean | 0.00095ms | 0.00095ms | +0.0000035ms | +0.37% |
| min | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.0028ms | +24.92% |
| total | 0.19ms | 0.19ms | +0.00070ms | +0.37% |

