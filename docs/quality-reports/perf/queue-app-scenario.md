# Perf Suite — queue-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 5.35ms | 5.84ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| consumer_processing_with_return (5 addJob + assertProcessed) | 26.69ms | 30.85ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| error_retry_cycle (fail 3 job + assertFailed) | 15.94ms | 17.28ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 5.87ms | 400ms | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 28.87ms | 400ms | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | 17.39ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | -14920 B | 0 B | 102400 B | yes | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 3608 B | 0 B | 102400 B | yes | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | -1328 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### producer_burst (20 addJob + process + drain)

# Perf Report — producer_burst (20 addJob + process + drain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 5.35ms |
| p50 | 5.76ms |
| p95 | 5.84ms |
| p99 | 5.92ms |
| mean | 5.64ms |
| stdev | 0.28ms |
| min | 4.68ms |
| max | 5.94ms |
| total | 112.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 5.35ms | 5.03ms | +0.32ms | +6.31% |
| p50 | 5.76ms | 5.82ms | -0.06ms | -1.10% |
| p95 | 5.84ms | 9.66ms | -3.82ms | -39.54% |
| p99 | 5.92ms | 9.95ms | -4.03ms | -40.46% |
| mean | 5.64ms | 6.09ms | -0.45ms | -7.39% |
| min | 4.68ms | 4.59ms | +0.09ms | +1.94% |
| max | 5.94ms | 10.02ms | -4.08ms | -40.68% |
| total | 112.74ms | 121.73ms | -8.99ms | -7.39% |

### consumer_processing_with_return (5 addJob + assertProcessed)

# Perf Report — consumer_processing_with_return (5 addJob + assertProcessed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 26.69ms |
| p50 | 28.27ms |
| p95 | 30.85ms |
| p99 | 30.89ms |
| mean | 28.28ms |
| stdev | 1.37ms |
| min | 26.42ms |
| max | 30.90ms |
| total | 565.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 26.69ms | 26.36ms | +0.33ms | +1.27% |
| p50 | 28.27ms | 27.80ms | +0.47ms | +1.68% |
| p95 | 30.85ms | 31.81ms | -0.97ms | -3.04% |
| p99 | 30.89ms | 33.49ms | -2.60ms | -7.76% |
| mean | 28.28ms | 28.55ms | -0.27ms | -0.93% |
| min | 26.42ms | 26.24ms | +0.18ms | +0.69% |
| max | 30.90ms | 33.91ms | -3.01ms | -8.87% |
| total | 565.65ms | 570.96ms | -5.30ms | -0.93% |

### error_retry_cycle (fail 3 job + assertFailed)

# Perf Report — error_retry_cycle (fail 3 job + assertFailed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 15.94ms |
| p50 | 16.18ms |
| p95 | 17.28ms |
| p99 | 17.32ms |
| mean | 16.36ms |
| stdev | 0.46ms |
| min | 15.78ms |
| max | 17.33ms |
| total | 327.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 15.94ms | 15.89ms | +0.05ms | +0.30% |
| p50 | 16.18ms | 16.40ms | -0.22ms | -1.33% |
| p95 | 17.28ms | 18.01ms | -0.73ms | -4.03% |
| p99 | 17.32ms | 18.54ms | -1.22ms | -6.56% |
| mean | 16.36ms | 16.69ms | -0.34ms | -2.01% |
| min | 15.78ms | 15.48ms | +0.30ms | +1.94% |
| max | 17.33ms | 18.67ms | -1.34ms | -7.17% |
| total | 327.11ms | 333.82ms | -6.71ms | -2.01% |

