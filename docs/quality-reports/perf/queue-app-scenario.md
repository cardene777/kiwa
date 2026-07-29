# Perf Suite — queue-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 4.75ms | 5.98ms | 200ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| consumer_processing_with_return (5 addJob + assertProcessed) | 26.51ms | 28.83ms | 200ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| error_retry_cycle (fail 3 job + assertFailed) | 16.08ms | 17.87ms | 200ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 6.52ms | 400ms | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 27.88ms | 400ms | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | 17.55ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | -14928 B | -17895 B | 102400 B | yes | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 6904 B | 0 B | 102400 B | yes | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | -240 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### producer_burst (20 addJob + process + drain)

# Perf Report — producer_burst (20 addJob + process + drain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 4.75ms |
| p50 | 5.80ms |
| p95 | 5.98ms |
| p99 | 6.01ms |
| mean | 5.55ms |
| stdev | 0.49ms |
| min | 4.60ms |
| max | 6.02ms |
| total | 111.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 4.75ms | 5.03ms | -0.28ms | -5.58% |
| p50 | 5.80ms | 5.82ms | -0.02ms | -0.34% |
| p95 | 5.98ms | 9.66ms | -3.68ms | -38.08% |
| p99 | 6.01ms | 9.95ms | -3.94ms | -39.59% |
| mean | 5.55ms | 6.09ms | -0.53ms | -8.76% |
| min | 4.60ms | 4.59ms | +0.01ms | +0.23% |
| max | 6.02ms | 10.02ms | -4.00ms | -39.95% |
| total | 111.06ms | 121.73ms | -10.67ms | -8.76% |

### consumer_processing_with_return (5 addJob + assertProcessed)

# Perf Report — consumer_processing_with_return (5 addJob + assertProcessed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 26.51ms |
| p50 | 27.71ms |
| p95 | 28.83ms |
| p99 | 29.35ms |
| mean | 27.66ms |
| stdev | 0.81ms |
| min | 26.28ms |
| max | 29.48ms |
| total | 553.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 26.51ms | 26.36ms | +0.15ms | +0.57% |
| p50 | 27.71ms | 27.80ms | -0.09ms | -0.31% |
| p95 | 28.83ms | 31.81ms | -2.99ms | -9.38% |
| p99 | 29.35ms | 33.49ms | -4.15ms | -12.38% |
| mean | 27.66ms | 28.55ms | -0.89ms | -3.11% |
| min | 26.28ms | 26.24ms | +0.04ms | +0.14% |
| max | 29.48ms | 33.91ms | -4.44ms | -13.08% |
| total | 553.22ms | 570.96ms | -17.74ms | -3.11% |

### error_retry_cycle (fail 3 job + assertFailed)

# Perf Report — error_retry_cycle (fail 3 job + assertFailed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 16.08ms |
| p50 | 16.40ms |
| p95 | 17.87ms |
| p99 | 17.88ms |
| mean | 16.82ms |
| stdev | 0.72ms |
| min | 15.94ms |
| max | 17.88ms |
| total | 336.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 16.08ms | 15.89ms | +0.19ms | +1.21% |
| p50 | 16.40ms | 16.40ms | +0.0062ms | +0.04% |
| p95 | 17.87ms | 18.01ms | -0.13ms | -0.74% |
| p99 | 17.88ms | 18.54ms | -0.66ms | -3.54% |
| mean | 16.82ms | 16.69ms | +0.13ms | +0.79% |
| min | 15.94ms | 15.48ms | +0.46ms | +2.97% |
| max | 17.88ms | 18.67ms | -0.79ms | -4.22% |
| total | 336.46ms | 333.82ms | +2.64ms | +0.79% |

