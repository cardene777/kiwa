# Perf Suite — data

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| queueSend | 0.00ms | 5ms | PASS | stable |
| fakeClockAdvance | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queueSend | 0.02ms | 10ms | PASS |
| fakeClockAdvance | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queueSend | 29064 B | 0 B | 102400 B | yes | PASS |
| fakeClockAdvance | -5168 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### queueSend

# Perf Report — queueSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +22.13% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +210.61% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -6.68% |
| mean | 0.00ms | 0.01ms | -0.01ms | -87.82% |
| min | 0.00ms | 0.00ms | +0.00ms | +12.61% |
| max | 0.02ms | 1.47ms | -1.44ms | -98.31% |
| total | 0.19ms | 1.59ms | -1.40ms | -87.82% |

### fakeClockAdvance

# Perf Report — fakeClockAdvance.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -14.49% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -28.23% |
| mean | 0.00ms | 0.00ms | -0.00ms | -22.88% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.34% |
| max | 0.01ms | 0.02ms | -0.02ms | -70.64% |
| total | 0.09ms | 0.12ms | -0.03ms | -22.88% |

