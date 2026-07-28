# Perf Suite — data

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| queueSend | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +54401%) 以上の悪化が必要) |
| fakeClockAdvance | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +63207%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queueSend | 0.02ms | 10ms | PASS |
| fakeClockAdvance | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queueSend | 29992 B | 0 B | 102400 B | yes | PASS |
| fakeClockAdvance | -5368 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +22.13% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +97.62% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +53.74% |
| mean | 0.00ms | 0.00ms | +0.00ms | +55.29% |
| min | 0.00ms | 0.00ms | +0.00ms | +12.61% |
| max | 0.01ms | 0.01ms | -0.00ms | -8.16% |
| total | 0.18ms | 0.12ms | +0.06ms | +55.29% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -10.93% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -5.19% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -1.51% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.27% |
| min | 0.00ms | 0.00ms | -0.00ms | -12.31% |
| max | 0.01ms | 0.01ms | +0.00ms | +15.26% |
| total | 0.09ms | 0.09ms | -0.00ms | -3.27% |

