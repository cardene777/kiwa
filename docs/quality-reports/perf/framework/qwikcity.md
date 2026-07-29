# Perf Suite — qwikcity

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeRouteLoader | 0.00079ms | 0.0027ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeRouteAction | 0.00075ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRouteLoader | 0.02ms | 10ms | PASS |
| invokeRouteAction | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRouteLoader | -6512 B | 0 B | 102400 B | yes | PASS |
| invokeRouteAction | 160 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeRouteLoader

# Perf Report — invokeRouteLoader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00079ms |
| p50 | 0.0011ms |
| p95 | 0.0027ms |
| p99 | 0.0091ms |
| mean | 0.0013ms |
| stdev | 0.0015ms |
| min | 0.00075ms |
| max | 0.01ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00079ms | 0.00075ms | +0.000042ms | +5.60% |
| p50 | 0.0011ms | 0.00079ms | +0.00033ms | +42.05% |
| p95 | 0.0027ms | 0.0034ms | -0.00065ms | -19.07% |
| p99 | 0.0091ms | 0.01ms | -0.00091ms | -9.08% |
| mean | 0.0013ms | 0.0014ms | -0.000026ms | -1.96% |
| min | 0.00075ms | 0.00075ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00025ms | +1.79% |
| total | 0.26ms | 0.27ms | -0.0053ms | -1.96% |

### invokeRouteAction

# Perf Report — invokeRouteAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00075ms |
| p50 | 0.00088ms |
| p95 | 0.0013ms |
| p99 | 0.0062ms |
| mean | 0.0011ms |
| stdev | 0.0012ms |
| min | 0.00071ms |
| max | 0.01ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00075ms | 0.00067ms | +0.000084ms | +12.61% |
| p50 | 0.00088ms | 0.00073ms | +0.00015ms | +19.95% |
| p95 | 0.0013ms | 0.0012ms | +0.000035ms | +2.83% |
| p99 | 0.0062ms | 0.0062ms | -0.000088ms | -1.41% |
| mean | 0.0011ms | 0.00095ms | +0.00014ms | +14.48% |
| min | 0.00071ms | 0.00063ms | +0.000083ms | +13.28% |
| max | 0.01ms | 0.01ms | +0.0026ms | +23.40% |
| total | 0.22ms | 0.19ms | +0.03ms | +14.48% |

