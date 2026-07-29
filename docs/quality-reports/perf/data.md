# Perf Suite — data

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| queueSend | 0.00033ms | 0.00050ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| fakeClockAdvance | 0.00067ms | 0.0015ms | 5ms | 0.00033ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queueSend | 0.01ms | 10ms | PASS |
| fakeClockAdvance | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queueSend | 21648 B | 0 B | 102400 B | yes | PASS |
| fakeClockAdvance | 4160 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.0035ms |
| mean | 0.00051ms |
| stdev | 0.00093ms |
| min | 0.00033ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00038ms | -0.000041ms | -10.93% |
| p50 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p95 | 0.00050ms | 0.0017ms | -0.0012ms | -71.04% |
| p99 | 0.0035ms | 0.0083ms | -0.0049ms | -58.50% |
| mean | 0.00051ms | 0.00075ms | -0.00024ms | -32.19% |
| min | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| max | 0.01ms | 0.01ms | -0.00017ms | -1.54% |
| total | 0.10ms | 0.15ms | -0.05ms | -32.19% |

### fakeClockAdvance

# Perf Report — fakeClockAdvance.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00075ms |
| p95 | 0.0015ms |
| p99 | 0.0078ms |
| mean | 0.0010ms |
| stdev | 0.0014ms |
| min | 0.00067ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00067ms | 0.00033ms | +0.00033ms | +100.30% |
| p50 | 0.00075ms | 0.00033ms | +0.00042ms | +124.55% |
| p95 | 0.0015ms | 0.00075ms | +0.00079ms | +105.88% |
| p99 | 0.0078ms | 0.0031ms | +0.0047ms | +148.85% |
| mean | 0.0010ms | 0.00046ms | +0.00056ms | +122.39% |
| min | 0.00067ms | 0.00029ms | +0.00038ms | +128.87% |
| max | 0.01ms | 0.0056ms | +0.0080ms | +142.97% |
| total | 0.20ms | 0.09ms | +0.11ms | +122.39% |

