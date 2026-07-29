# Perf Suite — data

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| queueSend | 0.00038ms | 0.0016ms | 5ms | 0.00042ms | PASS | stable (検知には +0.00042ms (baseline 比 +111%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| fakeClockAdvance | 0.00029ms | 0.00083ms | 5ms | 0.00042ms | PASS | stable (検知には +0.00042ms (baseline 比 +125%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queueSend | 0.02ms | 10ms | PASS |
| fakeClockAdvance | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queueSend | 19888 B | 0 B | 102400 B | yes | PASS |
| fakeClockAdvance | 3240 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### queueSend

# Perf Report — queueSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00046ms |
| p95 | 0.0016ms |
| p99 | 0.0098ms |
| mean | 0.00080ms |
| stdev | 0.0016ms |
| min | 0.00038ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00046ms | 0.00042ms | +0.000041ms | +9.83% |
| p95 | 0.0016ms | 0.0017ms | -0.00013ms | -7.60% |
| p99 | 0.0098ms | 0.0083ms | +0.0014ms | +17.02% |
| mean | 0.00080ms | 0.00075ms | +0.000043ms | +5.73% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.0032ms | +29.35% |
| total | 0.16ms | 0.15ms | +0.0086ms | +5.73% |

### fakeClockAdvance

# Perf Report — fakeClockAdvance.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00083ms |
| p99 | 0.0065ms |
| mean | 0.00064ms |
| stdev | 0.0020ms |
| min | 0.00025ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p50 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p95 | 0.00083ms | 0.00075ms | +0.000084ms | +11.20% |
| p99 | 0.0065ms | 0.0031ms | +0.0033ms | +104.96% |
| mean | 0.00064ms | 0.00046ms | +0.00018ms | +39.75% |
| min | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| max | 0.02ms | 0.0056ms | +0.02ms | +302.97% |
| total | 0.13ms | 0.09ms | +0.04ms | +39.75% |

