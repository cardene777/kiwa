# Perf Suite — queue-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 5.86ms | 200ms | PASS | stable |
| consumer_processing_with_return (5 addJob + assertProcessed) | 28.70ms | 200ms | PASS | stable |
| error_retry_cycle (fail 3 job + assertFailed) | 17.28ms | 200ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 5.96ms | 400ms | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 27.96ms | 400ms | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | 17.54ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | -32120 B | 0 B | 102400 B | yes | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 21400 B | 0 B | 102400 B | yes | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | -40 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### producer_burst (20 addJob + process + drain)

# Perf Report — producer_burst (20 addJob + process + drain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 5.80ms |
| p95 | 5.86ms |
| p99 | 5.87ms |
| mean | 5.56ms |
| stdev | 0.45ms |
| min | 4.69ms |
| max | 5.88ms |
| total | 111.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 5.80ms | 5.75ms | +0.04ms | +0.77% |
| p95 | 5.86ms | 5.82ms | +0.05ms | +0.83% |
| p99 | 5.87ms | 5.82ms | +0.05ms | +0.86% |
| mean | 5.56ms | 5.48ms | +0.08ms | +1.42% |
| min | 4.69ms | 4.60ms | +0.08ms | +1.77% |
| max | 5.88ms | 5.83ms | +0.05ms | +0.87% |
| total | 111.26ms | 109.69ms | +1.56ms | +1.42% |

### consumer_processing_with_return (5 addJob + assertProcessed)

# Perf Report — consumer_processing_with_return (5 addJob + assertProcessed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 27.90ms |
| p95 | 28.70ms |
| p99 | 28.78ms |
| mean | 27.71ms |
| stdev | 0.86ms |
| min | 26.37ms |
| max | 28.80ms |
| total | 554.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 27.90ms | 27.52ms | +0.39ms | +1.41% |
| p95 | 28.70ms | 28.67ms | +0.03ms | +0.11% |
| p99 | 28.78ms | 28.73ms | +0.05ms | +0.18% |
| mean | 27.71ms | 27.56ms | +0.15ms | +0.54% |
| min | 26.37ms | 26.07ms | +0.30ms | +1.15% |
| max | 28.80ms | 28.75ms | +0.06ms | +0.20% |
| total | 554.14ms | 551.16ms | +2.99ms | +0.54% |

### error_retry_cycle (fail 3 job + assertFailed)

# Perf Report — error_retry_cycle (fail 3 job + assertFailed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 16.25ms |
| p95 | 17.28ms |
| p99 | 17.29ms |
| mean | 16.39ms |
| stdev | 0.59ms |
| min | 15.30ms |
| max | 17.30ms |
| total | 327.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 16.25ms | 16.11ms | +0.14ms | +0.90% |
| p95 | 17.28ms | 17.17ms | +0.11ms | +0.65% |
| p99 | 17.29ms | 17.30ms | -0.00ms | -0.03% |
| mean | 16.39ms | 16.26ms | +0.13ms | +0.77% |
| min | 15.30ms | 15.52ms | -0.22ms | -1.42% |
| max | 17.30ms | 17.33ms | -0.03ms | -0.20% |
| total | 327.72ms | 325.21ms | +2.52ms | +0.77% |

