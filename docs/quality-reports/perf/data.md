# Perf Suite — data

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| queueSend | 0.00029ms | 0.00064ms | 5ms | 0.00033ms | PASS | stable (差 0.000084ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| fakeClockAdvance | 0.00025ms | 0.00075ms | 5ms | 0.00033ms | PASS | stable (差 0.000083ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queueSend | 0.01ms | 10ms | PASS |
| fakeClockAdvance | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queueSend | 22256 B | 0 B | 102400 B | yes | PASS |
| fakeClockAdvance | -256496 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### queueSend

# Perf Report — queueSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00064ms |
| p99 | 0.0061ms |
| mean | 0.00050ms |
| stdev | 0.00095ms |
| min | 0.00025ms |
| max | 0.0084ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00038ms | -0.000084ms | -22.40% |
| p50 | 0.00033ms | 0.00042ms | -0.000084ms | -20.14% |
| p95 | 0.00064ms | 0.0017ms | -0.0011ms | -63.08% |
| p99 | 0.0061ms | 0.0083ms | -0.0022ms | -26.36% |
| mean | 0.00050ms | 0.00075ms | -0.00026ms | -33.90% |
| min | 0.00025ms | 0.00038ms | -0.00013ms | -33.33% |
| max | 0.0084ms | 0.01ms | -0.0024ms | -22.01% |
| total | 0.10ms | 0.15ms | -0.05ms | -33.90% |

### fakeClockAdvance

# Perf Report — fakeClockAdvance.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00075ms |
| p99 | 0.0037ms |
| mean | 0.00042ms |
| stdev | 0.00061ms |
| min | 0.00025ms |
| max | 0.0066ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00033ms | -0.000083ms | -24.92% |
| p50 | 0.00029ms | 0.00033ms | -0.000042ms | -12.57% |
| p95 | 0.00075ms | 0.00075ms | +0.0000021ms | +0.28% |
| p99 | 0.0037ms | 0.0031ms | +0.00057ms | +18.04% |
| mean | 0.00042ms | 0.00046ms | -0.000038ms | -8.36% |
| min | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| max | 0.0066ms | 0.0056ms | +0.00096ms | +17.05% |
| total | 0.08ms | 0.09ms | -0.0076ms | -8.36% |

