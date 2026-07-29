# Perf Suite — grpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeUnary | 0.00066ms | 0.0018ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeServerStream | 0.00088ms | 0.0017ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeUnary | 0.02ms | 10ms | PASS |
| invokeServerStream | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeUnary | -13648 B | 0 B | 102400 B | yes | PASS |
| invokeServerStream | 216 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeUnary

# Perf Report — invokeUnary.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00066ms |
| p50 | 0.00071ms |
| p95 | 0.0018ms |
| p99 | 0.0060ms |
| mean | 0.00095ms |
| stdev | 0.0011ms |
| min | 0.00058ms |
| max | 0.01ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00066ms | 0.00063ms | +0.000037ms | +5.90% |
| p50 | 0.00071ms | 0.00067ms | +0.000041ms | +6.15% |
| p95 | 0.0018ms | 0.0020ms | -0.00013ms | -6.38% |
| p99 | 0.0060ms | 0.0055ms | +0.00048ms | +8.58% |
| mean | 0.00095ms | 0.00095ms | +0.0000019ms | +0.20% |
| min | 0.00058ms | 0.00058ms | +0.0000010ms | +0.17% |
| max | 0.01ms | 0.0084ms | +0.0029ms | +34.64% |
| total | 0.19ms | 0.19ms | +0.00038ms | +0.20% |

### invokeServerStream

# Perf Report — invokeServerStream.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.00096ms |
| p95 | 0.0017ms |
| p99 | 0.0074ms |
| mean | 0.0012ms |
| stdev | 0.0010ms |
| min | 0.00083ms |
| max | 0.01ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00083ms | +0.000041ms | +4.92% |
| p50 | 0.00096ms | 0.00092ms | +0.000041ms | +4.47% |
| p95 | 0.0017ms | 0.0025ms | -0.00083ms | -32.74% |
| p99 | 0.0074ms | 0.0071ms | +0.00027ms | +3.80% |
| mean | 0.0012ms | 0.0012ms | -0.000066ms | -5.27% |
| min | 0.00083ms | 0.00083ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.0012ms | -9.86% |
| total | 0.24ms | 0.25ms | -0.01ms | -5.27% |

