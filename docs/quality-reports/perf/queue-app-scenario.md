# Perf Suite — queue-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 5.95ms | 200ms | PASS | stable |
| consumer_processing_with_return (5 addJob + assertProcessed) | 28.62ms | 200ms | PASS | stable |
| error_retry_cycle (fail 3 job + assertFailed) | 17.21ms | 200ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 5.79ms | 400ms | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 27.40ms | 400ms | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | 17.18ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 1063632 B | 0 B | 102400 B | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 744008 B | 0 B | 102400 B | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | 519384 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### producer_burst (20 addJob + process + drain)

# Perf Report — producer_burst (20 addJob + process + drain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 5.74ms |
| p95 | 5.95ms |
| p99 | 6.04ms |
| mean | 5.51ms |
| stdev | 0.46ms |
| min | 4.62ms |
| max | 6.07ms |
| total | 110.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 5.74ms | 5.75ms | -0.01ms | -0.10% |
| p95 | 5.95ms | 6.39ms | -0.45ms | -6.99% |
| p99 | 6.04ms | 6.40ms | -0.36ms | -5.58% |
| mean | 5.51ms | 5.74ms | -0.23ms | -3.99% |
| min | 4.62ms | 5.07ms | -0.45ms | -8.82% |
| max | 6.07ms | 6.40ms | -0.33ms | -5.22% |
| total | 110.27ms | 114.85ms | -4.58ms | -3.99% |

### consumer_processing_with_return (5 addJob + assertProcessed)

# Perf Report — consumer_processing_with_return (5 addJob + assertProcessed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 27.52ms |
| p95 | 28.62ms |
| p99 | 29.35ms |
| mean | 27.46ms |
| stdev | 0.74ms |
| min | 26.28ms |
| max | 29.54ms |
| total | 549.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 27.52ms | 28.88ms | -1.36ms | -4.70% |
| p95 | 28.62ms | 30.45ms | -1.83ms | -6.00% |
| p99 | 29.35ms | 31.37ms | -2.02ms | -6.43% |
| mean | 27.46ms | 28.52ms | -1.05ms | -3.69% |
| min | 26.28ms | 25.27ms | +1.00ms | +3.98% |
| max | 29.54ms | 31.60ms | -2.07ms | -6.54% |
| total | 549.24ms | 570.31ms | -21.07ms | -3.69% |

### error_retry_cycle (fail 3 job + assertFailed)

# Perf Report — error_retry_cycle (fail 3 job + assertFailed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 15.99ms |
| p95 | 17.21ms |
| p99 | 17.24ms |
| mean | 16.30ms |
| stdev | 0.59ms |
| min | 15.64ms |
| max | 17.25ms |
| total | 326.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 15.99ms | 17.80ms | -1.80ms | -10.14% |
| p95 | 17.21ms | 18.97ms | -1.76ms | -9.27% |
| p99 | 17.24ms | 18.98ms | -1.74ms | -9.17% |
| mean | 16.30ms | 17.48ms | -1.17ms | -6.71% |
| min | 15.64ms | 15.14ms | +0.50ms | +3.31% |
| max | 17.25ms | 18.99ms | -1.74ms | -9.15% |
| total | 326.07ms | 349.52ms | -23.45ms | -6.71% |

