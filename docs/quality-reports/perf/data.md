# Perf Suite — data

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| queueSend | 0.00042ms | 0.0012ms | 5ms | 0.00050ms | PASS | stable (検知には +0.00050ms (baseline 比 +133%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| fakeClockAdvance | 0.00029ms | 0.00084ms | 5ms | 0.00050ms | PASS | stable (検知には +0.00050ms (baseline 比 +150%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queueSend | 0.02ms | 10ms | PASS |
| fakeClockAdvance | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queueSend | 20480 B | 0 B | 102400 B | yes | PASS |
| fakeClockAdvance | 4384 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### queueSend

# Perf Report — queueSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0012ms |
| p99 | 0.0074ms |
| mean | 0.00069ms |
| stdev | 0.0011ms |
| min | 0.00038ms |
| max | 0.0083ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00038ms | +0.000041ms | +10.93% |
| p50 | 0.00046ms | 0.00042ms | +0.000041ms | +9.83% |
| p95 | 0.0012ms | 0.0017ms | -0.00056ms | -32.18% |
| p99 | 0.0074ms | 0.0083ms | -0.00096ms | -11.54% |
| mean | 0.00069ms | 0.00075ms | -0.000059ms | -7.82% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.0083ms | 0.01ms | -0.0025ms | -23.55% |
| total | 0.14ms | 0.15ms | -0.01ms | -7.82% |

### fakeClockAdvance

# Perf Report — fakeClockAdvance.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00035ms |
| p95 | 0.00084ms |
| p99 | 0.0041ms |
| mean | 0.00050ms |
| stdev | 0.00079ms |
| min | 0.00029ms |
| max | 0.0076ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p50 | 0.00035ms | 0.00033ms | +0.000021ms | +6.14% |
| p95 | 0.00084ms | 0.00075ms | +0.000087ms | +11.63% |
| p99 | 0.0041ms | 0.0031ms | +0.0010ms | +31.68% |
| mean | 0.00050ms | 0.00046ms | +0.000046ms | +9.99% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.0076ms | 0.0056ms | +0.0020ms | +34.81% |
| total | 0.10ms | 0.09ms | +0.0091ms | +9.99% |

