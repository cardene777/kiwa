# Perf Suite — core

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| parseSpec | 0.0047ms | 0.02ms | 5ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| createPool | 0.0011ms | 0.0026ms | 5ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseSpec | 0.09ms | 10ms | PASS |
| createPool | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseSpec | -6136 B | 0 B | 102400 B | yes | PASS |
| createPool | -338408 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### parseSpec

# Perf Report — parseSpec.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0047ms |
| p50 | 0.0056ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0073ms |
| stdev | 0.0039ms |
| min | 0.0046ms |
| max | 0.02ms |
| total | 1.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0047ms | 0.0050ms | -0.00029ms | -5.70% |
| p50 | 0.0056ms | 0.0066ms | -0.0010ms | -15.66% |
| p95 | 0.02ms | 0.02ms | -0.00010ms | -0.67% |
| p99 | 0.02ms | 0.02ms | +0.0028ms | +14.63% |
| mean | 0.0073ms | 0.0080ms | -0.00070ms | -8.66% |
| min | 0.0046ms | 0.0047ms | -0.00013ms | -2.63% |
| max | 0.02ms | 0.02ms | +0.0010ms | +4.61% |
| total | 1.47ms | 1.61ms | -0.14ms | -8.66% |

### createPool

# Perf Report — createPool.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0011ms |
| p50 | 0.0012ms |
| p95 | 0.0026ms |
| p99 | 0.0084ms |
| mean | 0.0015ms |
| stdev | 0.0012ms |
| min | 0.0011ms |
| max | 0.01ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0012ms | -0.000042ms | -3.60% |
| p50 | 0.0012ms | 0.0013ms | -0.00017ms | -12.49% |
| p95 | 0.0026ms | 0.0029ms | -0.00031ms | -10.63% |
| p99 | 0.0084ms | 0.0081ms | +0.00028ms | +3.40% |
| mean | 0.0015ms | 0.0016ms | -0.00015ms | -9.05% |
| min | 0.0011ms | 0.0011ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.02ms | -0.0083ms | -43.16% |
| total | 0.30ms | 0.33ms | -0.03ms | -9.05% |

