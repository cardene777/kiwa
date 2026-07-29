# Perf Suite — queue-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 4.63ms | 5.83ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| consumer_processing_with_return (5 addJob + assertProcessed) | 26.23ms | 28.61ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| error_retry_cycle (fail 3 job + assertFailed) | 16.05ms | 17.40ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 5.88ms | 400ms | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 28.58ms | 400ms | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | 17.85ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | -15016 B | 0 B | 102400 B | yes | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 4000 B | 0 B | 102400 B | yes | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | -240 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### producer_burst (20 addJob + process + drain)

# Perf Report — producer_burst (20 addJob + process + drain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 4.63ms |
| p50 | 5.73ms |
| p95 | 5.83ms |
| p99 | 5.84ms |
| mean | 5.46ms |
| stdev | 0.50ms |
| min | 4.58ms |
| max | 5.84ms |
| total | 109.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 4.63ms | 5.03ms | -0.40ms | -7.91% |
| p50 | 5.73ms | 5.82ms | -0.09ms | -1.62% |
| p95 | 5.83ms | 9.66ms | -3.82ms | -39.60% |
| p99 | 5.84ms | 9.95ms | -4.11ms | -41.29% |
| mean | 5.46ms | 6.09ms | -0.62ms | -10.24% |
| min | 4.58ms | 4.59ms | -0.0096ms | -0.21% |
| max | 5.84ms | 10.02ms | -4.18ms | -41.69% |
| total | 109.26ms | 121.73ms | -12.47ms | -10.24% |

### consumer_processing_with_return (5 addJob + assertProcessed)

# Perf Report — consumer_processing_with_return (5 addJob + assertProcessed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 26.23ms |
| p50 | 27.48ms |
| p95 | 28.61ms |
| p99 | 28.94ms |
| mean | 27.35ms |
| stdev | 0.87ms |
| min | 25.97ms |
| max | 29.02ms |
| total | 546.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 26.23ms | 26.36ms | -0.13ms | -0.51% |
| p50 | 27.48ms | 27.80ms | -0.32ms | -1.15% |
| p95 | 28.61ms | 31.81ms | -3.20ms | -10.07% |
| p99 | 28.94ms | 33.49ms | -4.56ms | -13.60% |
| mean | 27.35ms | 28.55ms | -1.20ms | -4.21% |
| min | 25.97ms | 26.24ms | -0.27ms | -1.05% |
| max | 29.02ms | 33.91ms | -4.89ms | -14.43% |
| total | 546.90ms | 570.96ms | -24.06ms | -4.21% |

### error_retry_cycle (fail 3 job + assertFailed)

# Perf Report — error_retry_cycle (fail 3 job + assertFailed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 16.05ms |
| p50 | 16.56ms |
| p95 | 17.40ms |
| p99 | 18.44ms |
| mean | 16.61ms |
| stdev | 0.82ms |
| min | 14.54ms |
| max | 18.70ms |
| total | 332.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 16.05ms | 15.89ms | +0.16ms | +0.98% |
| p50 | 16.56ms | 16.40ms | +0.16ms | +0.97% |
| p95 | 17.40ms | 18.01ms | -0.61ms | -3.37% |
| p99 | 18.44ms | 18.54ms | -0.10ms | -0.54% |
| mean | 16.61ms | 16.69ms | -0.08ms | -0.47% |
| min | 14.54ms | 15.48ms | -0.95ms | -6.12% |
| max | 18.70ms | 18.67ms | +0.03ms | +0.14% |
| total | 332.24ms | 333.82ms | -1.58ms | -0.47% |

