# Perf Suite — core

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| parseSpec | 0.0050ms | 0.01ms | 5ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| createPool | 0.0011ms | 0.0022ms | 5ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseSpec | 0.11ms | 10ms | PASS |
| createPool | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseSpec | -6648 B | 0 B | 102400 B | yes | PASS |
| createPool | 3664 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### parseSpec

# Perf Report — parseSpec.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0050ms |
| p50 | 0.0057ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0072ms |
| stdev | 0.0033ms |
| min | 0.0047ms |
| max | 0.03ms |
| total | 1.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0050ms | 0.0050ms | -0.000078ms | -1.55% |
| p50 | 0.0057ms | 0.0066ms | -0.00096ms | -14.42% |
| p95 | 0.01ms | 0.02ms | -0.0021ms | -13.38% |
| p99 | 0.02ms | 0.02ms | -0.0023ms | -11.98% |
| mean | 0.0072ms | 0.0080ms | -0.00083ms | -10.37% |
| min | 0.0047ms | 0.0047ms | -0.000042ms | -0.88% |
| max | 0.03ms | 0.02ms | +0.0025ms | +10.88% |
| total | 1.44ms | 1.61ms | -0.17ms | -10.37% |

### createPool

# Perf Report — createPool.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0011ms |
| p50 | 0.0012ms |
| p95 | 0.0022ms |
| p99 | 0.0069ms |
| mean | 0.0015ms |
| stdev | 0.0012ms |
| min | 0.0010ms |
| max | 0.01ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0012ms | -0.000084ms | -7.20% |
| p50 | 0.0012ms | 0.0013ms | -0.00017ms | -12.56% |
| p95 | 0.0022ms | 0.0029ms | -0.00071ms | -24.19% |
| p99 | 0.0069ms | 0.0081ms | -0.0012ms | -14.85% |
| mean | 0.0015ms | 0.0016ms | -0.00019ms | -11.74% |
| min | 0.0010ms | 0.0011ms | -0.000042ms | -3.88% |
| max | 0.01ms | 0.02ms | -0.0075ms | -38.83% |
| total | 0.29ms | 0.33ms | -0.04ms | -11.74% |

