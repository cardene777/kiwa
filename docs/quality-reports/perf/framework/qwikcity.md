# Perf Suite — qwikcity

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeRouteLoader | 0.0010ms | 0.0027ms | 5ms | 0.00033ms | PASS | stable (差 0.00025ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| invokeRouteAction | 0.00067ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRouteLoader | 0.02ms | 10ms | PASS |
| invokeRouteAction | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRouteLoader | -11160 B | 0 B | 102400 B | yes | PASS |
| invokeRouteAction | -24 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeRouteLoader

# Perf Report — invokeRouteLoader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0011ms |
| p95 | 0.0027ms |
| p99 | 0.01ms |
| mean | 0.0014ms |
| stdev | 0.0018ms |
| min | 0.00075ms |
| max | 0.02ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.00075ms | +0.00025ms | +33.33% |
| p50 | 0.0011ms | 0.00079ms | +0.00029ms | +36.74% |
| p95 | 0.0027ms | 0.0034ms | -0.00074ms | -21.89% |
| p99 | 0.01ms | 0.01ms | +0.000068ms | +0.68% |
| mean | 0.0014ms | 0.0014ms | +0.000067ms | +4.95% |
| min | 0.00075ms | 0.00075ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0033ms | +23.15% |
| total | 0.28ms | 0.27ms | +0.01ms | +4.95% |

### invokeRouteAction

# Perf Report — invokeRouteAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00071ms |
| p95 | 0.0012ms |
| p99 | 0.0052ms |
| mean | 0.00090ms |
| stdev | 0.0010ms |
| min | 0.00063ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00067ms | 0.00067ms | 0.00ms | 0.00% |
| p50 | 0.00071ms | 0.00073ms | -0.000022ms | -2.95% |
| p95 | 0.0012ms | 0.0012ms | -0.000019ms | -1.52% |
| p99 | 0.0052ms | 0.0062ms | -0.0010ms | -16.24% |
| mean | 0.00090ms | 0.00095ms | -0.000043ms | -4.57% |
| min | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00067ms | +6.04% |
| total | 0.18ms | 0.19ms | -0.0086ms | -4.57% |

