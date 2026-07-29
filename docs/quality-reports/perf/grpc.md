# Perf Suite — grpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeUnary | 0.00058ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeServerStream | 0.0010ms | 0.0022ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeUnary | 0.01ms | 10ms | PASS |
| invokeServerStream | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeUnary | -9488 B | -33955 B | 102400 B | yes | PASS |
| invokeServerStream | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeUnary

# Perf Report — invokeUnary.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00063ms |
| p95 | 0.0015ms |
| p99 | 0.0061ms |
| mean | 0.00090ms |
| stdev | 0.0019ms |
| min | 0.00054ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00063ms | -0.000042ms | -6.72% |
| p50 | 0.00063ms | 0.00067ms | -0.000042ms | -6.30% |
| p95 | 0.0015ms | 0.0020ms | -0.00050ms | -25.54% |
| p99 | 0.0061ms | 0.0055ms | +0.00056ms | +10.14% |
| mean | 0.00090ms | 0.00095ms | -0.000051ms | -5.41% |
| min | 0.00054ms | 0.00058ms | -0.000041ms | -7.03% |
| max | 0.02ms | 0.0084ms | +0.02ms | +194.05% |
| total | 0.18ms | 0.19ms | -0.01ms | -5.41% |

### invokeServerStream

# Perf Report — invokeServerStream.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0011ms |
| p95 | 0.0022ms |
| p99 | 0.0083ms |
| mean | 0.0014ms |
| stdev | 0.0014ms |
| min | 0.00096ms |
| max | 0.01ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.00083ms | +0.00017ms | +19.90% |
| p50 | 0.0011ms | 0.00092ms | +0.00017ms | +18.10% |
| p95 | 0.0022ms | 0.0025ms | -0.00031ms | -12.31% |
| p99 | 0.0083ms | 0.0071ms | +0.0012ms | +16.87% |
| mean | 0.0014ms | 0.0012ms | +0.00014ms | +11.24% |
| min | 0.00096ms | 0.00083ms | +0.00013ms | +15.01% |
| max | 0.01ms | 0.01ms | +0.0010ms | +8.16% |
| total | 0.28ms | 0.25ms | +0.03ms | +11.24% |

