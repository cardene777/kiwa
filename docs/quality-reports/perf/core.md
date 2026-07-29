# Perf Suite — core

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| parseSpec | 0.0042ms | 0.0090ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| createPool | 0.0012ms | 0.0026ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseSpec | 0.06ms | 10ms | PASS |
| createPool | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseSpec | -6872 B | 0 B | 102400 B | yes | PASS |
| createPool | 4464 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### parseSpec

# Perf Report — parseSpec.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0042ms |
| p50 | 0.0053ms |
| p95 | 0.0090ms |
| p99 | 0.01ms |
| mean | 0.0057ms |
| stdev | 0.0020ms |
| min | 0.0040ms |
| max | 0.02ms |
| total | 1.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0042ms | 0.0050ms | -0.00083ms | -16.46% |
| p50 | 0.0053ms | 0.0066ms | -0.0013ms | -19.75% |
| p95 | 0.0090ms | 0.02ms | -0.0065ms | -41.79% |
| p99 | 0.01ms | 0.02ms | -0.0050ms | -26.00% |
| mean | 0.0057ms | 0.0080ms | -0.0024ms | -29.44% |
| min | 0.0040ms | 0.0047ms | -0.00071ms | -14.91% |
| max | 0.02ms | 0.02ms | -0.0013ms | -5.73% |
| total | 1.13ms | 1.61ms | -0.47ms | -29.44% |

### createPool

# Perf Report — createPool.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0012ms |
| p50 | 0.0014ms |
| p95 | 0.0026ms |
| p99 | 0.01ms |
| mean | 0.0017ms |
| stdev | 0.0016ms |
| min | 0.0012ms |
| max | 0.01ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0012ms | 0.0012ms | +0.000042ms | +3.59% |
| p50 | 0.0014ms | 0.0013ms | +0.000084ms | +6.26% |
| p95 | 0.0026ms | 0.0029ms | -0.00039ms | -13.09% |
| p99 | 0.01ms | 0.0081ms | +0.0039ms | +48.00% |
| mean | 0.0017ms | 0.0016ms | +0.000058ms | +3.51% |
| min | 0.0012ms | 0.0011ms | +0.000083ms | +7.66% |
| max | 0.01ms | 0.02ms | -0.0042ms | -22.13% |
| total | 0.34ms | 0.33ms | +0.01ms | +3.51% |

