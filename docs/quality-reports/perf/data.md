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

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| queueSend | 567440 B | 0 B | 102400 B | PASS |
| fakeClockAdvance | 135968 B | 0 B | 102400 B | PASS |

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -34.53% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +65.48% |
| mean | 0.00ms | 0.00ms | +0.00ms | +12.62% |
| min | 0.00ms | 0.00ms | +0.00ms | +33.20% |
| max | 0.01ms | 0.01ms | +0.00ms | +10.28% |
| total | 0.11ms | 0.10ms | +0.01ms | +12.62% |

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
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.19ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -11.20% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +50.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +83.32% |
| mean | 0.00ms | 0.00ms | +0.00ms | +215.57% |
| min | 0.00ms | 0.00ms | -0.00ms | -12.61% |
| max | 0.19ms | 0.00ms | +0.19ms | +4050.46% |
| total | 0.29ms | 0.09ms | +0.19ms | +215.57% |

