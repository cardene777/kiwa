# Perf Suite — queue-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 6.40ms | 200ms | PASS | stable |
| consumer_processing_with_return (5 addJob + assertProcessed) | 30.03ms | 200ms | PASS | stable |
| error_retry_cycle (fail 3 job + assertFailed) | 18.11ms | 200ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 6.43ms | 400ms | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 29.37ms | 400ms | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | 18.65ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | -32512 B | 0 B | 102400 B | yes | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 12432 B | 0 B | 102400 B | yes | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | -1112 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### producer_burst (20 addJob + process + drain)

# Perf Report — producer_burst (20 addJob + process + drain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 5.40ms |
| p95 | 6.40ms |
| p99 | 6.40ms |
| mean | 5.60ms |
| stdev | 0.65ms |
| min | 4.63ms |
| max | 6.41ms |
| total | 111.93ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 5.40ms | 5.75ms | -0.35ms | -6.15% |
| p95 | 6.40ms | 5.82ms | +0.58ms | +10.01% |
| p99 | 6.40ms | 5.82ms | +0.58ms | +9.97% |
| mean | 5.60ms | 5.48ms | +0.11ms | +2.04% |
| min | 4.63ms | 4.60ms | +0.03ms | +0.61% |
| max | 6.41ms | 5.83ms | +0.58ms | +9.97% |
| total | 111.93ms | 109.69ms | +2.24ms | +2.04% |

### consumer_processing_with_return (5 addJob + assertProcessed)

# Perf Report — consumer_processing_with_return (5 addJob + assertProcessed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 28.21ms |
| p95 | 30.03ms |
| p99 | 30.24ms |
| mean | 28.37ms |
| stdev | 1.45ms |
| min | 24.75ms |
| max | 30.29ms |
| total | 567.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 28.21ms | 27.52ms | +0.70ms | +2.53% |
| p95 | 30.03ms | 28.67ms | +1.36ms | +4.74% |
| p99 | 30.24ms | 28.73ms | +1.50ms | +5.24% |
| mean | 28.37ms | 27.56ms | +0.81ms | +2.95% |
| min | 24.75ms | 26.07ms | -1.32ms | -5.08% |
| max | 30.29ms | 28.75ms | +1.54ms | +5.36% |
| total | 567.42ms | 551.16ms | +16.26ms | +2.95% |

### error_retry_cycle (fail 3 job + assertFailed)

# Perf Report — error_retry_cycle (fail 3 job + assertFailed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 16.56ms |
| p95 | 18.11ms |
| p99 | 18.33ms |
| mean | 16.73ms |
| stdev | 0.93ms |
| min | 14.95ms |
| max | 18.38ms |
| total | 334.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 16.56ms | 16.11ms | +0.46ms | +2.83% |
| p95 | 18.11ms | 17.17ms | +0.95ms | +5.52% |
| p99 | 18.33ms | 17.30ms | +1.03ms | +5.94% |
| mean | 16.73ms | 16.26ms | +0.47ms | +2.87% |
| min | 14.95ms | 15.52ms | -0.57ms | -3.70% |
| max | 18.38ms | 17.33ms | +1.05ms | +6.04% |
| total | 334.56ms | 325.21ms | +9.35ms | +2.87% |

