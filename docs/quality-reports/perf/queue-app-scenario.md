# Perf Suite — queue-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 5.13ms | 6.47ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| consumer_processing_with_return (5 addJob + assertProcessed) | 27.21ms | 29.78ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| error_retry_cycle (fail 3 job + assertFailed) | 16.50ms | 18.98ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 6.65ms | 400ms | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 31.92ms | 400ms | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | 22.03ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | -16264 B | 0 B | 102400 B | yes | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 6352 B | 0 B | 102400 B | yes | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | -320 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### producer_burst (20 addJob + process + drain)

# Perf Report — producer_burst (20 addJob + process + drain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 5.13ms |
| p50 | 6.18ms |
| p95 | 6.47ms |
| p99 | 6.50ms |
| mean | 5.86ms |
| stdev | 0.65ms |
| min | 4.68ms |
| max | 6.50ms |
| total | 117.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 5.13ms | 5.03ms | +0.10ms | +2.09% |
| p50 | 6.18ms | 5.82ms | +0.36ms | +6.17% |
| p95 | 6.47ms | 9.66ms | -3.18ms | -32.95% |
| p99 | 6.50ms | 9.95ms | -3.45ms | -34.70% |
| mean | 5.86ms | 6.09ms | -0.23ms | -3.73% |
| min | 4.68ms | 4.59ms | +0.09ms | +1.86% |
| max | 6.50ms | 10.02ms | -3.52ms | -35.12% |
| total | 117.19ms | 121.73ms | -4.54ms | -3.73% |

### consumer_processing_with_return (5 addJob + assertProcessed)

# Perf Report — consumer_processing_with_return (5 addJob + assertProcessed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 27.21ms |
| p50 | 28.93ms |
| p95 | 29.78ms |
| p99 | 30.12ms |
| mean | 28.57ms |
| stdev | 0.94ms |
| min | 26.88ms |
| max | 30.21ms |
| total | 571.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 27.21ms | 26.36ms | +0.85ms | +3.23% |
| p50 | 28.93ms | 27.80ms | +1.13ms | +4.05% |
| p95 | 29.78ms | 31.81ms | -2.04ms | -6.40% |
| p99 | 30.12ms | 33.49ms | -3.37ms | -10.07% |
| mean | 28.57ms | 28.55ms | +0.03ms | +0.10% |
| min | 26.88ms | 26.24ms | +0.64ms | +2.44% |
| max | 30.21ms | 33.91ms | -3.71ms | -10.93% |
| total | 571.50ms | 570.96ms | +0.54ms | +0.10% |

### error_retry_cycle (fail 3 job + assertFailed)

# Perf Report — error_retry_cycle (fail 3 job + assertFailed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 16.50ms |
| p50 | 17.19ms |
| p95 | 18.98ms |
| p99 | 19.26ms |
| mean | 17.31ms |
| stdev | 0.85ms |
| min | 15.82ms |
| max | 19.33ms |
| total | 346.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 16.50ms | 15.89ms | +0.61ms | +3.85% |
| p50 | 17.19ms | 16.40ms | +0.79ms | +4.85% |
| p95 | 18.98ms | 18.01ms | +0.97ms | +5.38% |
| p99 | 19.26ms | 18.54ms | +0.72ms | +3.90% |
| mean | 17.31ms | 16.69ms | +0.62ms | +3.69% |
| min | 15.82ms | 15.48ms | +0.34ms | +2.20% |
| max | 19.33ms | 18.67ms | +0.66ms | +3.54% |
| total | 346.12ms | 333.82ms | +12.30ms | +3.69% |

