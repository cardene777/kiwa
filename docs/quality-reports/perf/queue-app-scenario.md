# Perf Suite — queue-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 5.17ms | 6.44ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| consumer_processing_with_return (5 addJob + assertProcessed) | 27.53ms | 29.46ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| error_retry_cycle (fail 3 job + assertFailed) | 16.03ms | 18.89ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 6.46ms | 400ms | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 30.77ms | 400ms | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | 17.82ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | -13312 B | 0 B | 102400 B | yes | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 4976 B | 0 B | 102400 B | yes | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | -320 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### producer_burst (20 addJob + process + drain)

# Perf Report — producer_burst (20 addJob + process + drain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 5.17ms |
| p50 | 6.38ms |
| p95 | 6.44ms |
| p99 | 6.46ms |
| mean | 6.01ms |
| stdev | 0.57ms |
| min | 5.14ms |
| max | 6.46ms |
| total | 120.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 5.17ms | 5.03ms | +0.14ms | +2.78% |
| p50 | 6.38ms | 5.82ms | +0.56ms | +9.61% |
| p95 | 6.44ms | 9.66ms | -3.22ms | -33.31% |
| p99 | 6.46ms | 9.95ms | -3.49ms | -35.08% |
| mean | 6.01ms | 6.09ms | -0.08ms | -1.28% |
| min | 5.14ms | 4.59ms | +0.55ms | +12.03% |
| max | 6.46ms | 10.02ms | -3.56ms | -35.51% |
| total | 120.17ms | 121.73ms | -1.56ms | -1.28% |

### consumer_processing_with_return (5 addJob + assertProcessed)

# Perf Report — consumer_processing_with_return (5 addJob + assertProcessed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 27.53ms |
| p50 | 28.50ms |
| p95 | 29.46ms |
| p99 | 29.59ms |
| mean | 28.37ms |
| stdev | 0.92ms |
| min | 26.20ms |
| max | 29.63ms |
| total | 567.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 27.53ms | 26.36ms | +1.17ms | +4.43% |
| p50 | 28.50ms | 27.80ms | +0.70ms | +2.53% |
| p95 | 29.46ms | 31.81ms | -2.35ms | -7.39% |
| p99 | 29.59ms | 33.49ms | -3.90ms | -11.64% |
| mean | 28.37ms | 28.55ms | -0.17ms | -0.61% |
| min | 26.20ms | 26.24ms | -0.04ms | -0.15% |
| max | 29.63ms | 33.91ms | -4.28ms | -12.63% |
| total | 567.49ms | 570.96ms | -3.47ms | -0.61% |

### error_retry_cycle (fail 3 job + assertFailed)

# Perf Report — error_retry_cycle (fail 3 job + assertFailed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 16.03ms |
| p50 | 17.16ms |
| p95 | 18.89ms |
| p99 | 19.06ms |
| mean | 17.24ms |
| stdev | 1.00ms |
| min | 15.93ms |
| max | 19.10ms |
| total | 344.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 16.03ms | 15.89ms | +0.14ms | +0.87% |
| p50 | 17.16ms | 16.40ms | +0.76ms | +4.63% |
| p95 | 18.89ms | 18.01ms | +0.88ms | +4.89% |
| p99 | 19.06ms | 18.54ms | +0.52ms | +2.80% |
| mean | 17.24ms | 16.69ms | +0.55ms | +3.30% |
| min | 15.93ms | 15.48ms | +0.44ms | +2.87% |
| max | 19.10ms | 18.67ms | +0.43ms | +2.30% |
| total | 344.82ms | 333.82ms | +11.00ms | +3.30% |

