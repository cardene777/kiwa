# Perf Suite — dogfood-anthropic-chatbot

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| reply | 9.12ms | 30ms | PASS | stable |
| replyStream | 15.43ms | 50ms | PASS | stable |
| toolLoop | 18.23ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| reply | 9.29ms | 60ms | PASS |
| replyStream | 15.41ms | 100ms | PASS |
| toolLoop | 18.43ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| reply | -4552056 B | -32738 B | 102400 B | PASS |
| replyStream | -4292904 B | 0 B | 102400 B | PASS |
| toolLoop | 309312 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### reply

# Perf Report — reply.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p50 | 9.07ms |
| p95 | 9.12ms |
| p99 | 9.24ms |
| mean | 9.01ms |
| stdev | 0.23ms |
| min | 7.97ms |
| max | 9.24ms |
| total | 540.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 9.07ms | 9.07ms | -0.00ms | -0.02% |
| p95 | 9.12ms | 9.15ms | -0.03ms | -0.28% |
| p99 | 9.24ms | 9.20ms | +0.05ms | +0.49% |
| mean | 9.01ms | 8.96ms | +0.05ms | +0.51% |
| min | 7.97ms | 8.02ms | -0.05ms | -0.67% |
| max | 9.24ms | 9.20ms | +0.05ms | +0.49% |
| total | 540.49ms | 537.73ms | +2.76ms | +0.51% |

### replyStream

# Perf Report — replyStream.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p50 | 15.08ms |
| p95 | 15.43ms |
| p99 | 16.15ms |
| mean | 15.01ms |
| stdev | 0.41ms |
| min | 13.80ms |
| max | 16.15ms |
| total | 900.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 15.08ms | 15.08ms | +0.00ms | +0.02% |
| p95 | 15.43ms | 15.35ms | +0.09ms | +0.56% |
| p99 | 16.15ms | 16.27ms | -0.12ms | -0.76% |
| mean | 15.01ms | 14.86ms | +0.16ms | +1.06% |
| min | 13.80ms | 12.64ms | +1.16ms | +9.16% |
| max | 16.15ms | 16.27ms | -0.12ms | -0.76% |
| total | 900.79ms | 891.32ms | +9.47ms | +1.06% |

### toolLoop

# Perf Report — toolLoop.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p50 | 18.15ms |
| p95 | 18.23ms |
| p99 | 18.32ms |
| mean | 18.02ms |
| stdev | 0.32ms |
| min | 16.91ms |
| max | 18.32ms |
| total | 1081.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 18.15ms | 18.12ms | +0.03ms | +0.15% |
| p95 | 18.23ms | 18.25ms | -0.03ms | -0.14% |
| p99 | 18.32ms | 18.31ms | +0.01ms | +0.06% |
| mean | 18.02ms | 17.91ms | +0.10ms | +0.58% |
| min | 16.91ms | 16.61ms | +0.30ms | +1.81% |
| max | 18.32ms | 18.31ms | +0.01ms | +0.06% |
| total | 1081.05ms | 1074.78ms | +6.26ms | +0.58% |

