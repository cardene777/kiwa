# Perf Suite — core

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| parseSpec | 0.0056ms | 0.02ms | 5ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| createPool | 0.0013ms | 0.0025ms | 5ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseSpec | 0.19ms | 10ms | PASS |
| createPool | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseSpec | -6936 B | 0 B | 102400 B | yes | PASS |
| createPool | 4608 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### parseSpec

# Perf Report — parseSpec.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0056ms |
| p50 | 0.0061ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0083ms |
| stdev | 0.0038ms |
| min | 0.0053ms |
| max | 0.03ms |
| total | 1.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0056ms | 0.0050ms | +0.00055ms | +10.84% |
| p50 | 0.0061ms | 0.0066ms | -0.00052ms | -7.83% |
| p95 | 0.02ms | 0.02ms | -0.00024ms | -1.55% |
| p99 | 0.02ms | 0.02ms | +0.0020ms | +10.75% |
| mean | 0.0083ms | 0.0080ms | +0.00024ms | +2.94% |
| min | 0.0053ms | 0.0047ms | +0.00054ms | +11.39% |
| max | 0.03ms | 0.02ms | +0.0068ms | +30.25% |
| total | 1.65ms | 1.61ms | +0.05ms | +2.94% |

### createPool

# Perf Report — createPool.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0015ms |
| p95 | 0.0025ms |
| p99 | 0.0082ms |
| mean | 0.0017ms |
| stdev | 0.0014ms |
| min | 0.0012ms |
| max | 0.01ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0012ms | +0.000083ms | +7.11% |
| p50 | 0.0015ms | 0.0013ms | +0.00012ms | +9.34% |
| p95 | 0.0025ms | 0.0029ms | -0.00047ms | -15.84% |
| p99 | 0.0082ms | 0.0081ms | +0.000038ms | +0.47% |
| mean | 0.0017ms | 0.0016ms | +0.000067ms | +4.09% |
| min | 0.0012ms | 0.0011ms | +0.000083ms | +7.66% |
| max | 0.01ms | 0.02ms | -0.0052ms | -26.90% |
| total | 0.34ms | 0.33ms | +0.01ms | +4.09% |

