# Perf Suite — grpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeUnary | 0.00058ms | 0.0016ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeServerStream | 0.00096ms | 0.0023ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeUnary | 0.01ms | 10ms | PASS |
| invokeServerStream | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeUnary | -15544 B | 0 B | 102400 B | yes | PASS |
| invokeServerStream | -296 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeUnary

# Perf Report — invokeUnary.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00067ms |
| p95 | 0.0016ms |
| p99 | 0.0063ms |
| mean | 0.00087ms |
| stdev | 0.0010ms |
| min | 0.00054ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00063ms | -0.000042ms | -6.72% |
| p50 | 0.00067ms | 0.00067ms | -0.0000010ms | -0.15% |
| p95 | 0.0016ms | 0.0020ms | -0.00033ms | -16.90% |
| p99 | 0.0063ms | 0.0055ms | +0.00076ms | +13.71% |
| mean | 0.00087ms | 0.00095ms | -0.000084ms | -8.87% |
| min | 0.00054ms | 0.00058ms | -0.000041ms | -7.03% |
| max | 0.01ms | 0.0084ms | +0.0029ms | +34.16% |
| total | 0.17ms | 0.19ms | -0.02ms | -8.87% |

### invokeServerStream

# Perf Report — invokeServerStream.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00096ms |
| p50 | 0.0010ms |
| p95 | 0.0023ms |
| p99 | 0.0077ms |
| mean | 0.0018ms |
| stdev | 0.0075ms |
| min | 0.00088ms |
| max | 0.11ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00096ms | 0.00083ms | +0.00012ms | +14.87% |
| p50 | 0.0010ms | 0.00092ms | +0.000083ms | +9.05% |
| p95 | 0.0023ms | 0.0025ms | -0.00026ms | -10.17% |
| p99 | 0.0077ms | 0.0071ms | +0.00063ms | +8.89% |
| mean | 0.0018ms | 0.0012ms | +0.00057ms | +45.40% |
| min | 0.00088ms | 0.00083ms | +0.000042ms | +5.04% |
| max | 0.11ms | 0.01ms | +0.09ms | +764.63% |
| total | 0.36ms | 0.25ms | +0.11ms | +45.40% |

