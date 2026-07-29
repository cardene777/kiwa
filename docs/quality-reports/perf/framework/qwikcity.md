# Perf Suite — qwikcity

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeRouteLoader | 0.00075ms | 0.0034ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeRouteAction | 0.00071ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRouteLoader | 0.02ms | 10ms | PASS |
| invokeRouteAction | 0.16ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRouteLoader | -23368 B | 0 B | 102400 B | yes | PASS |
| invokeRouteAction | -2544 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeRouteLoader

# Perf Report — invokeRouteLoader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00075ms |
| p50 | 0.0011ms |
| p95 | 0.0034ms |
| p99 | 0.0089ms |
| mean | 0.0014ms |
| stdev | 0.0014ms |
| min | 0.00071ms |
| max | 0.01ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00075ms | 0.00075ms | 0.00ms | 0.00% |
| p50 | 0.0011ms | 0.00079ms | +0.00029ms | +36.74% |
| p95 | 0.0034ms | 0.0034ms | -0.000045ms | -1.33% |
| p99 | 0.0089ms | 0.01ms | -0.0011ms | -11.26% |
| mean | 0.0014ms | 0.0014ms | +0.000017ms | +1.23% |
| min | 0.00071ms | 0.00075ms | -0.000041ms | -5.47% |
| max | 0.01ms | 0.01ms | -0.00017ms | -1.18% |
| total | 0.27ms | 0.27ms | +0.0033ms | +1.23% |

### invokeRouteAction

# Perf Report — invokeRouteAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00071ms |
| p50 | 0.00079ms |
| p95 | 0.0012ms |
| p99 | 0.0057ms |
| mean | 0.0010ms |
| stdev | 0.0011ms |
| min | 0.00067ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00071ms | 0.00067ms | +0.000042ms | +6.31% |
| p50 | 0.00079ms | 0.00073ms | +0.000062ms | +8.57% |
| p95 | 0.0012ms | 0.0012ms | -0.000061ms | -4.94% |
| p99 | 0.0057ms | 0.0062ms | -0.00055ms | -8.75% |
| mean | 0.0010ms | 0.00095ms | +0.000058ms | +6.18% |
| min | 0.00067ms | 0.00063ms | +0.000041ms | +6.56% |
| max | 0.01ms | 0.01ms | +0.0017ms | +15.11% |
| total | 0.20ms | 0.19ms | +0.01ms | +6.18% |

