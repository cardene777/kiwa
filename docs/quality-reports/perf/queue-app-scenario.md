# Perf Suite — queue-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 5.94ms | 200ms | PASS | stable |
| consumer_processing_with_return (5 addJob + assertProcessed) | 28.83ms | 200ms | PASS | stable |
| error_retry_cycle (fail 3 job + assertFailed) | 17.27ms | 200ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 5.89ms | 400ms | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 27.64ms | 400ms | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | 17.42ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | -14680 B | 0 B | 102400 B | yes | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | -11960 B | 0 B | 102400 B | yes | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | -320 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### producer_burst (20 addJob + process + drain)

# Perf Report — producer_burst (20 addJob + process + drain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 5.79ms |
| p95 | 5.94ms |
| p99 | 6.02ms |
| mean | 5.62ms |
| stdev | 0.41ms |
| min | 4.63ms |
| max | 6.04ms |
| total | 112.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 5.79ms | 5.77ms | +0.02ms | +0.33% |
| p95 | 5.94ms | 5.89ms | +0.04ms | +0.74% |
| p99 | 6.02ms | 6.10ms | -0.08ms | -1.34% |
| mean | 5.62ms | 5.49ms | +0.13ms | +2.32% |
| min | 4.63ms | 4.53ms | +0.10ms | +2.31% |
| max | 6.04ms | 6.56ms | -0.53ms | -8.00% |
| total | 112.43ms | 521.93ms | -409.50ms | -78.46% |

### consumer_processing_with_return (5 addJob + assertProcessed)

# Perf Report — consumer_processing_with_return (5 addJob + assertProcessed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 27.54ms |
| p95 | 28.83ms |
| p99 | 28.92ms |
| mean | 27.63ms |
| stdev | 0.78ms |
| min | 26.18ms |
| max | 28.95ms |
| total | 552.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 27.54ms | 27.83ms | -0.29ms | -1.04% |
| p95 | 28.83ms | 30.08ms | -1.25ms | -4.17% |
| p99 | 28.92ms | 32.05ms | -3.13ms | -9.77% |
| mean | 27.63ms | 28.08ms | -0.45ms | -1.61% |
| min | 26.18ms | 25.12ms | +1.07ms | +4.26% |
| max | 28.95ms | 32.96ms | -4.01ms | -12.18% |
| total | 552.54ms | 2667.44ms | -2114.90ms | -79.29% |

### error_retry_cycle (fail 3 job + assertFailed)

# Perf Report — error_retry_cycle (fail 3 job + assertFailed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 16.09ms |
| p95 | 17.27ms |
| p99 | 17.30ms |
| mean | 16.30ms |
| stdev | 0.72ms |
| min | 14.61ms |
| max | 17.31ms |
| total | 325.99ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 16.09ms | 16.52ms | -0.43ms | -2.61% |
| p95 | 17.27ms | 18.59ms | -1.32ms | -7.11% |
| p99 | 17.30ms | 19.07ms | -1.76ms | -9.24% |
| mean | 16.30ms | 16.78ms | -0.48ms | -2.84% |
| min | 14.61ms | 14.71ms | -0.10ms | -0.69% |
| max | 17.31ms | 19.52ms | -2.21ms | -11.31% |
| total | 325.99ms | 1593.77ms | -1267.78ms | -79.55% |

