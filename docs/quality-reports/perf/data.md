# Perf Suite — data

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| queueSend | 0.00033ms | 0.00050ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| fakeClockAdvance | 0.00029ms | 0.00088ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +100%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queueSend | 0.01ms | 10ms | PASS |
| fakeClockAdvance | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queueSend | 26952 B | -27865 B | 102400 B | yes | PASS |
| fakeClockAdvance | 6000 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### queueSend

# Perf Report — queueSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00050ms |
| p99 | 0.0034ms |
| mean | 0.00048ms |
| stdev | 0.00076ms |
| min | 0.00033ms |
| max | 0.0092ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00038ms | -0.000041ms | -10.93% |
| p50 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p95 | 0.00050ms | 0.0017ms | -0.0012ms | -71.04% |
| p99 | 0.0034ms | 0.0083ms | -0.0049ms | -59.25% |
| mean | 0.00048ms | 0.00075ms | -0.00027ms | -36.01% |
| min | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| max | 0.0092ms | 0.01ms | -0.0016ms | -14.67% |
| total | 0.10ms | 0.15ms | -0.05ms | -36.01% |

### fakeClockAdvance

# Perf Report — fakeClockAdvance.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00038ms |
| p95 | 0.00088ms |
| p99 | 0.0036ms |
| mean | 0.00049ms |
| stdev | 0.00070ms |
| min | 0.00025ms |
| max | 0.0073ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000041ms | -12.31% |
| p50 | 0.00038ms | 0.00033ms | +0.000041ms | +12.28% |
| p95 | 0.00088ms | 0.00075ms | +0.00013ms | +16.95% |
| p99 | 0.0036ms | 0.0031ms | +0.00050ms | +15.76% |
| mean | 0.00049ms | 0.00046ms | +0.000032ms | +7.08% |
| min | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| max | 0.0073ms | 0.0056ms | +0.0017ms | +30.36% |
| total | 0.10ms | 0.09ms | +0.0065ms | +7.08% |

