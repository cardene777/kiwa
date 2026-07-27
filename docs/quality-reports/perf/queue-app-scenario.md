# Perf Suite — queue-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 5.82ms | 200ms | PASS | stable |
| consumer_processing_with_return (5 addJob + assertProcessed) | 28.63ms | 200ms | PASS | stable |
| error_retry_cycle (fail 3 job + assertFailed) | 17.29ms | 200ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 5.84ms | 400ms | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 28.73ms | 400ms | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | 17.98ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | -32072 B | 0 B | 102400 B | yes | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 13440 B | 0 B | 102400 B | yes | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | -1464 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### producer_burst (20 addJob + process + drain)

# Perf Report — producer_burst (20 addJob + process + drain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 5.74ms |
| p95 | 5.82ms |
| p99 | 5.82ms |
| mean | 5.42ms |
| stdev | 0.54ms |
| min | 4.38ms |
| max | 5.82ms |
| total | 108.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 5.74ms | 5.75ms | -0.01ms | -0.20% |
| p95 | 5.82ms | 5.82ms | +0.00ms | +0.06% |
| p99 | 5.82ms | 5.82ms | -0.00ms | -0.07% |
| mean | 5.42ms | 5.48ms | -0.06ms | -1.17% |
| min | 4.38ms | 4.60ms | -0.22ms | -4.82% |
| max | 5.82ms | 5.83ms | -0.01ms | -0.10% |
| total | 108.41ms | 109.69ms | -1.29ms | -1.17% |

### consumer_processing_with_return (5 addJob + assertProcessed)

# Perf Report — consumer_processing_with_return (5 addJob + assertProcessed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 27.40ms |
| p95 | 28.63ms |
| p99 | 28.66ms |
| mean | 27.42ms |
| stdev | 0.69ms |
| min | 26.28ms |
| max | 28.67ms |
| total | 548.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 27.40ms | 27.52ms | -0.11ms | -0.41% |
| p95 | 28.63ms | 28.67ms | -0.05ms | -0.17% |
| p99 | 28.66ms | 28.73ms | -0.07ms | -0.26% |
| mean | 27.42ms | 27.56ms | -0.13ms | -0.48% |
| min | 26.28ms | 26.07ms | +0.20ms | +0.79% |
| max | 28.67ms | 28.75ms | -0.08ms | -0.28% |
| total | 548.49ms | 551.16ms | -2.66ms | -0.48% |

### error_retry_cycle (fail 3 job + assertFailed)

# Perf Report — error_retry_cycle (fail 3 job + assertFailed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 16.16ms |
| p95 | 17.29ms |
| p99 | 17.31ms |
| mean | 16.41ms |
| stdev | 0.56ms |
| min | 15.76ms |
| max | 17.31ms |
| total | 328.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 16.16ms | 16.11ms | +0.06ms | +0.35% |
| p95 | 17.29ms | 17.17ms | +0.13ms | +0.75% |
| p99 | 17.31ms | 17.30ms | +0.01ms | +0.06% |
| mean | 16.41ms | 16.26ms | +0.15ms | +0.93% |
| min | 15.76ms | 15.52ms | +0.23ms | +1.51% |
| max | 17.31ms | 17.33ms | -0.02ms | -0.11% |
| total | 328.24ms | 325.21ms | +3.03ms | +0.93% |

