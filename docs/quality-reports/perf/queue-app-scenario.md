# Perf Suite — queue-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 25.96ms | 200ms | PASS | regressed — gate 無効 (regressionGate=false) |
| consumer_processing_with_return (5 addJob + assertProcessed) | 30.53ms | 200ms | PASS | stable — gate 無効 (regressionGate=false) |
| error_retry_cycle (fail 3 job + assertFailed) | 19.70ms | 200ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 7.09ms | 400ms | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 30.05ms | 400ms | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | 18.09ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | -16016 B | -22489 B | 102400 B | yes | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 5144 B | 0 B | 102400 B | yes | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | -1664 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### producer_burst (20 addJob + process + drain)

# Perf Report — producer_burst (20 addJob + process + drain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 7.13ms |
| p95 | 25.96ms |
| p99 | 44.44ms |
| mean | 10.63ms |
| stdev | 10.18ms |
| min | 5.52ms |
| max | 49.06ms |
| total | 212.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 7.13ms | 5.77ms | +1.36ms | +23.60% |
| p95 | 25.96ms | 5.89ms | +20.06ms | +340.42% |
| p99 | 44.44ms | 6.10ms | +38.34ms | +628.63% |
| mean | 10.63ms | 5.49ms | +5.14ms | +93.55% |
| min | 5.52ms | 4.53ms | +0.99ms | +21.93% |
| max | 49.06ms | 6.56ms | +42.50ms | +647.55% |
| total | 212.68ms | 521.93ms | -309.25ms | -59.25% |

### consumer_processing_with_return (5 addJob + assertProcessed)

# Perf Report — consumer_processing_with_return (5 addJob + assertProcessed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 28.75ms |
| p95 | 30.53ms |
| p99 | 30.83ms |
| mean | 28.63ms |
| stdev | 1.36ms |
| min | 25.81ms |
| max | 30.90ms |
| total | 572.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 28.75ms | 27.83ms | +0.92ms | +3.31% |
| p95 | 30.53ms | 30.08ms | +0.45ms | +1.49% |
| p99 | 30.83ms | 32.05ms | -1.22ms | -3.82% |
| mean | 28.63ms | 28.08ms | +0.56ms | +1.98% |
| min | 25.81ms | 25.12ms | +0.69ms | +2.76% |
| max | 30.90ms | 32.96ms | -2.06ms | -6.24% |
| total | 572.69ms | 2667.44ms | -2094.76ms | -78.53% |

### error_retry_cycle (fail 3 job + assertFailed)

# Perf Report — error_retry_cycle (fail 3 job + assertFailed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 17.40ms |
| p95 | 19.70ms |
| p99 | 24.67ms |
| mean | 17.75ms |
| stdev | 2.20ms |
| min | 15.60ms |
| max | 25.91ms |
| total | 355.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 17.40ms | 16.52ms | +0.88ms | +5.35% |
| p95 | 19.70ms | 18.59ms | +1.10ms | +5.93% |
| p99 | 24.67ms | 19.07ms | +5.60ms | +29.37% |
| mean | 17.75ms | 16.78ms | +0.98ms | +5.81% |
| min | 15.60ms | 14.71ms | +0.89ms | +6.08% |
| max | 25.91ms | 19.52ms | +6.39ms | +32.73% |
| total | 355.04ms | 1593.77ms | -1238.73ms | -77.72% |

