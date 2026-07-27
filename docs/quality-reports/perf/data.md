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
| queueSend | 0.01ms | 10ms | PASS |
| fakeClockAdvance | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queueSend | 28232 B | 0 B | 102400 B | yes | PASS |
| fakeClockAdvance | -14920 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -11.59% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -11.01% |
| mean | 0.00ms | 0.01ms | -0.01ms | -92.35% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 1.47ms | -1.45ms | -98.98% |
| total | 0.12ms | 1.59ms | -1.47ms | -92.35% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -11.20% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -18.93% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -33.83% |
| mean | 0.00ms | 0.00ms | -0.00ms | -26.69% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.34% |
| max | 0.01ms | 0.02ms | -0.02ms | -74.79% |
| total | 0.09ms | 0.12ms | -0.03ms | -26.69% |

