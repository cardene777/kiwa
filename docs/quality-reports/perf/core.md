# Perf Suite — core

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| parseSpec | 0.0037ms | 0.0085ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| createPool | 0.0012ms | 0.0027ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseSpec | 0.05ms | 10ms | PASS |
| createPool | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseSpec | -7888 B | 0 B | 102400 B | yes | PASS |
| createPool | 3632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### parseSpec

# Perf Report — parseSpec.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0037ms |
| p50 | 0.0044ms |
| p95 | 0.0085ms |
| p99 | 0.01ms |
| mean | 0.0049ms |
| stdev | 0.0019ms |
| min | 0.0035ms |
| max | 0.02ms |
| total | 0.97ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0050ms | -0.0014ms | -27.20% |
| p50 | 0.0044ms | 0.0066ms | -0.0023ms | -34.17% |
| p95 | 0.0085ms | 0.02ms | -0.0071ms | -45.57% |
| p99 | 0.01ms | 0.02ms | -0.0050ms | -25.99% |
| mean | 0.0049ms | 0.0080ms | -0.0032ms | -39.51% |
| min | 0.0035ms | 0.0047ms | -0.0012ms | -25.45% |
| max | 0.02ms | 0.02ms | -0.0062ms | -27.49% |
| total | 0.97ms | 1.61ms | -0.63ms | -39.51% |

### createPool

# Perf Report — createPool.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0012ms |
| p50 | 0.0012ms |
| p95 | 0.0027ms |
| p99 | 0.0070ms |
| mean | 0.0015ms |
| stdev | 0.0013ms |
| min | 0.0011ms |
| max | 0.01ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0012ms | 0.0012ms | -0.0000010ms | -0.09% |
| p50 | 0.0012ms | 0.0013ms | -0.00013ms | -9.41% |
| p95 | 0.0027ms | 0.0029ms | -0.00022ms | -7.63% |
| p99 | 0.0070ms | 0.0081ms | -0.0011ms | -13.27% |
| mean | 0.0015ms | 0.0016ms | -0.00013ms | -7.98% |
| min | 0.0011ms | 0.0011ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.02ms | -0.0069ms | -36.01% |
| total | 0.30ms | 0.33ms | -0.03ms | -7.98% |

