# Perf Suite — grpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeUnary | 0.00054ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeServerStream | 0.00092ms | 0.0018ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeUnary | 0.01ms | 10ms | PASS |
| invokeServerStream | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeUnary | -9824 B | 0 B | 102400 B | yes | PASS |
| invokeServerStream | -22096 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeUnary

# Perf Report — invokeUnary.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00063ms |
| p95 | 0.0013ms |
| p99 | 0.0053ms |
| mean | 0.00079ms |
| stdev | 0.00081ms |
| min | 0.00054ms |
| max | 0.0084ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00063ms | -0.000083ms | -13.28% |
| p50 | 0.00063ms | 0.00067ms | -0.000042ms | -6.30% |
| p95 | 0.0013ms | 0.0020ms | -0.00066ms | -33.48% |
| p99 | 0.0053ms | 0.0055ms | -0.00025ms | -4.47% |
| mean | 0.00079ms | 0.00095ms | -0.00016ms | -17.16% |
| min | 0.00054ms | 0.00058ms | -0.000042ms | -7.20% |
| max | 0.0084ms | 0.0084ms | -0.0000010ms | -0.01% |
| total | 0.16ms | 0.19ms | -0.03ms | -17.16% |

### invokeServerStream

# Perf Report — invokeServerStream.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00092ms |
| p50 | 0.0011ms |
| p95 | 0.0018ms |
| p99 | 0.0071ms |
| mean | 0.0012ms |
| stdev | 0.0010ms |
| min | 0.00088ms |
| max | 0.01ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00092ms | 0.00083ms | +0.000082ms | +9.83% |
| p50 | 0.0011ms | 0.00092ms | +0.00017ms | +18.16% |
| p95 | 0.0018ms | 0.0025ms | -0.00075ms | -29.32% |
| p99 | 0.0071ms | 0.0071ms | +0.000014ms | +0.20% |
| mean | 0.0012ms | 0.0012ms | -0.0000096ms | -0.77% |
| min | 0.00088ms | 0.00083ms | +0.000042ms | +5.04% |
| max | 0.01ms | 0.01ms | -0.0011ms | -8.84% |
| total | 0.25ms | 0.25ms | -0.0019ms | -0.77% |

