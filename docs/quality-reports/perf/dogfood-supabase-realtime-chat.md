# Perf Suite — dogfood-supabase-realtime-chat

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| joinRoom | 3.47ms | 50ms | PASS | stable |
| sendMessage | 3.48ms | 30ms | PASS | stable |
| getPresence | 0.01ms | 30ms | PASS | stable |
| sendTyping | 3.47ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| joinRoom | 3.58ms | 100ms | PASS |
| sendMessage | 3.54ms | 60ms | PASS |
| getPresence | 0.02ms | 60ms | PASS |
| sendTyping | 3.51ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| joinRoom | -4921664 B | -39213 B | 102400 B | PASS |
| sendMessage | 917344 B | 0 B | 102400 B | PASS |
| getPresence | 1009512 B | 0 B | 102400 B | PASS |
| sendTyping | 1016024 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### joinRoom

# Perf Report — joinRoom.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 3.42ms |
| p95 | 3.47ms |
| p99 | 3.48ms |
| mean | 3.39ms |
| stdev | 0.18ms |
| min | 2.29ms |
| max | 3.48ms |
| total | 135.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 3.42ms | 3.43ms | -0.01ms | -0.33% |
| p95 | 3.47ms | 3.50ms | -0.04ms | -1.07% |
| p99 | 3.48ms | 3.52ms | -0.04ms | -1.02% |
| mean | 3.39ms | 3.44ms | -0.05ms | -1.41% |
| min | 2.29ms | 3.25ms | -0.96ms | -29.41% |
| max | 3.48ms | 3.52ms | -0.04ms | -1.02% |
| total | 135.61ms | 137.55ms | -1.94ms | -1.41% |

### sendMessage

# Perf Report — sendMessage.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 3.42ms |
| p95 | 3.48ms |
| p99 | 3.49ms |
| mean | 3.43ms |
| stdev | 0.02ms |
| min | 3.40ms |
| max | 3.49ms |
| total | 137.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 3.42ms | 3.43ms | -0.01ms | -0.16% |
| p95 | 3.48ms | 3.49ms | -0.01ms | -0.25% |
| p99 | 3.49ms | 3.68ms | -0.18ms | -5.02% |
| mean | 3.43ms | 3.39ms | +0.04ms | +1.11% |
| min | 3.40ms | 2.30ms | +1.10ms | +48.00% |
| max | 3.49ms | 3.68ms | -0.18ms | -5.02% |
| total | 137.20ms | 135.70ms | +1.50ms | +1.11% |

### getPresence

# Perf Report — getPresence.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -17.41% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +19.05% |
| p99 | 0.02ms | 0.02ms | +0.01ms | +39.40% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.91% |
| min | 0.00ms | 0.00ms | -0.00ms | -14.29% |
| max | 0.02ms | 0.02ms | +0.01ms | +39.40% |
| total | 0.08ms | 0.08ms | -0.00ms | -3.91% |

### sendTyping

# Perf Report — sendTyping.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 3.43ms |
| p95 | 3.47ms |
| p99 | 3.50ms |
| mean | 3.39ms |
| stdev | 0.19ms |
| min | 2.29ms |
| max | 3.50ms |
| total | 135.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 3.43ms | 3.42ms | +0.00ms | +0.05% |
| p95 | 3.47ms | 3.45ms | +0.02ms | +0.49% |
| p99 | 3.50ms | 3.50ms | -0.00ms | -0.03% |
| mean | 3.39ms | 3.41ms | -0.01ms | -0.42% |
| min | 2.29ms | 2.98ms | -0.69ms | -23.17% |
| max | 3.50ms | 3.50ms | -0.00ms | -0.03% |
| total | 135.76ms | 136.33ms | -0.57ms | -0.42% |

