# Perf Suite — qwikcity

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeRouteLoader | 0.00088ms | 0.0037ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeRouteAction | 0.00083ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable (差 0.00017ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRouteLoader | 0.02ms | 10ms | PASS |
| invokeRouteAction | 0.06ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRouteLoader | -19568 B | -10826 B | 102400 B | yes | PASS |
| invokeRouteAction | 20744 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeRouteLoader

# Perf Report — invokeRouteLoader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.0012ms |
| p95 | 0.0037ms |
| p99 | 0.0095ms |
| mean | 0.0017ms |
| stdev | 0.0016ms |
| min | 0.00083ms |
| max | 0.01ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00075ms | +0.00013ms | +16.67% |
| p50 | 0.0012ms | 0.00079ms | +0.00037ms | +47.22% |
| p95 | 0.0037ms | 0.0034ms | +0.00027ms | +7.98% |
| p99 | 0.0095ms | 0.01ms | -0.00053ms | -5.26% |
| mean | 0.0017ms | 0.0014ms | +0.00033ms | +24.79% |
| min | 0.00083ms | 0.00075ms | +0.000083ms | +11.07% |
| max | 0.01ms | 0.01ms | +0.00029ms | +2.08% |
| total | 0.34ms | 0.27ms | +0.07ms | +24.79% |

### invokeRouteAction

# Perf Report — invokeRouteAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.00088ms |
| p95 | 0.0013ms |
| p99 | 0.0064ms |
| mean | 0.0011ms |
| stdev | 0.0012ms |
| min | 0.00083ms |
| max | 0.01ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00083ms | 0.00067ms | +0.00017ms | +25.08% |
| p50 | 0.00088ms | 0.00073ms | +0.00015ms | +19.95% |
| p95 | 0.0013ms | 0.0012ms | +0.000073ms | +5.90% |
| p99 | 0.0064ms | 0.0062ms | +0.00016ms | +2.53% |
| mean | 0.0011ms | 0.00095ms | +0.00014ms | +14.97% |
| min | 0.00083ms | 0.00063ms | +0.00021ms | +33.28% |
| max | 0.01ms | 0.01ms | +0.0028ms | +25.30% |
| total | 0.22ms | 0.19ms | +0.03ms | +14.97% |

