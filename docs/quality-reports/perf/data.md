# Perf Suite — data

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| queueSend | 0.00029ms | 0.00072ms | 5ms | 0.00033ms | PASS | stable (差 0.000083ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| fakeClockAdvance | 0.00033ms | 0.00079ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queueSend | 0.01ms | 10ms | PASS |
| fakeClockAdvance | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queueSend | 22280 B | 0 B | 102400 B | yes | PASS |
| fakeClockAdvance | 16232 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### queueSend

# Perf Report — queueSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00072ms |
| p99 | 0.0047ms |
| mean | 0.00047ms |
| stdev | 0.00073ms |
| min | 0.00025ms |
| max | 0.0074ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00038ms | -0.000083ms | -22.13% |
| p50 | 0.00033ms | 0.00042ms | -0.000083ms | -19.90% |
| p95 | 0.00072ms | 0.0017ms | -0.0010ms | -58.28% |
| p99 | 0.0047ms | 0.0083ms | -0.0037ms | -43.97% |
| mean | 0.00047ms | 0.00075ms | -0.00028ms | -37.03% |
| min | 0.00025ms | 0.00038ms | -0.00013ms | -33.33% |
| max | 0.0074ms | 0.01ms | -0.0034ms | -31.27% |
| total | 0.09ms | 0.15ms | -0.06ms | -37.03% |

### fakeClockAdvance

# Perf Report — fakeClockAdvance.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00033ms |
| p95 | 0.00079ms |
| p99 | 0.0036ms |
| mean | 0.00049ms |
| stdev | 0.00073ms |
| min | 0.00025ms |
| max | 0.0075ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p95 | 0.00079ms | 0.00075ms | +0.000041ms | +5.47% |
| p99 | 0.0036ms | 0.0031ms | +0.00046ms | +14.57% |
| mean | 0.00049ms | 0.00046ms | +0.000032ms | +6.91% |
| min | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| max | 0.0075ms | 0.0056ms | +0.0018ms | +32.59% |
| total | 0.10ms | 0.09ms | +0.0063ms | +6.91% |

