# Perf Suite — data

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| queueSend | 0.00033ms | 0.00050ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| fakeClockAdvance | 0.00029ms | 0.00075ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queueSend | 0.01ms | 10ms | PASS |
| fakeClockAdvance | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queueSend | -183656 B | -27865 B | 102400 B | yes | PASS |
| fakeClockAdvance | 5576 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### queueSend

# Perf Report — queueSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00033ms |
| p95 | 0.00050ms |
| p99 | 0.0055ms |
| mean | 0.00057ms |
| stdev | 0.0021ms |
| min | 0.00025ms |
| max | 0.03ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p50 | 0.00033ms | 0.00042ms | -0.000083ms | -19.90% |
| p95 | 0.00050ms | 0.0017ms | -0.0012ms | -71.04% |
| p99 | 0.0055ms | 0.0083ms | -0.0029ms | -34.31% |
| mean | 0.00057ms | 0.00075ms | -0.00018ms | -24.03% |
| min | 0.00025ms | 0.00038ms | -0.00013ms | -33.33% |
| max | 0.03ms | 0.01ms | +0.02ms | +162.56% |
| total | 0.11ms | 0.15ms | -0.04ms | -24.03% |

### fakeClockAdvance

# Perf Report — fakeClockAdvance.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00075ms |
| p99 | 0.0044ms |
| mean | 0.00048ms |
| stdev | 0.00074ms |
| min | 0.00025ms |
| max | 0.0078ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000041ms | -12.31% |
| p50 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p95 | 0.00075ms | 0.00075ms | +0.0000020ms | +0.27% |
| p99 | 0.0044ms | 0.0031ms | +0.0012ms | +39.28% |
| mean | 0.00048ms | 0.00046ms | +0.000022ms | +4.90% |
| min | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| max | 0.0078ms | 0.0056ms | +0.0022ms | +39.25% |
| total | 0.10ms | 0.09ms | +0.0045ms | +4.90% |

