# Perf Suite — qwikcity

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeRouteLoader | 0.00075ms | 0.0032ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeRouteAction | 0.00063ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRouteLoader | 0.03ms | 10ms | PASS |
| invokeRouteAction | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRouteLoader | -27768 B | 0 B | 102400 B | yes | PASS |
| invokeRouteAction | -348224 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeRouteLoader

# Perf Report — invokeRouteLoader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00075ms |
| p50 | 0.00096ms |
| p95 | 0.0032ms |
| p99 | 0.01ms |
| mean | 0.0015ms |
| stdev | 0.0019ms |
| min | 0.00075ms |
| max | 0.01ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00075ms | 0.00075ms | 0.00ms | 0.00% |
| p50 | 0.00096ms | 0.00079ms | +0.00017ms | +21.02% |
| p95 | 0.0032ms | 0.0034ms | -0.00017ms | -5.13% |
| p99 | 0.01ms | 0.01ms | +0.0044ms | +43.64% |
| mean | 0.0015ms | 0.0014ms | +0.00015ms | +10.97% |
| min | 0.00075ms | 0.00075ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00088ms | +6.23% |
| total | 0.30ms | 0.27ms | +0.03ms | +10.97% |

### invokeRouteAction

# Perf Report — invokeRouteAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00071ms |
| p95 | 0.0011ms |
| p99 | 0.0062ms |
| mean | 0.00092ms |
| stdev | 0.0011ms |
| min | 0.00063ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00067ms | -0.000041ms | -6.16% |
| p50 | 0.00071ms | 0.00073ms | -0.000022ms | -2.95% |
| p95 | 0.0011ms | 0.0012ms | -0.00010ms | -8.52% |
| p99 | 0.0062ms | 0.0062ms | -0.000050ms | -0.80% |
| mean | 0.00092ms | 0.00095ms | -0.000030ms | -3.15% |
| min | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.0011ms | +10.20% |
| total | 0.18ms | 0.19ms | -0.0060ms | -3.15% |

