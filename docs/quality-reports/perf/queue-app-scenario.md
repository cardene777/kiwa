# Perf Suite — queue-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 4.68ms | 5.86ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| consumer_processing_with_return (5 addJob + assertProcessed) | 26.44ms | 28.67ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| error_retry_cycle (fail 3 job + assertFailed) | 15.99ms | 17.63ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 5.89ms | 400ms | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 27.63ms | 400ms | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | 17.40ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | -13976 B | 0 B | 102400 B | yes | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 5064 B | 0 B | 102400 B | yes | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | -240 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### producer_burst (20 addJob + process + drain)

# Perf Report — producer_burst (20 addJob + process + drain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 4.68ms |
| p50 | 5.80ms |
| p95 | 5.86ms |
| p99 | 5.92ms |
| mean | 5.51ms |
| stdev | 0.50ms |
| min | 4.66ms |
| max | 5.93ms |
| total | 110.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 4.68ms | 5.03ms | -0.35ms | -6.95% |
| p50 | 5.80ms | 5.82ms | -0.02ms | -0.36% |
| p95 | 5.86ms | 9.66ms | -3.79ms | -39.29% |
| p99 | 5.92ms | 9.95ms | -4.03ms | -40.49% |
| mean | 5.51ms | 6.09ms | -0.58ms | -9.52% |
| min | 4.66ms | 4.59ms | +0.07ms | +1.57% |
| max | 5.93ms | 10.02ms | -4.09ms | -40.78% |
| total | 110.14ms | 121.73ms | -11.59ms | -9.52% |

### consumer_processing_with_return (5 addJob + assertProcessed)

# Perf Report — consumer_processing_with_return (5 addJob + assertProcessed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 26.44ms |
| p50 | 27.57ms |
| p95 | 28.67ms |
| p99 | 28.67ms |
| mean | 27.43ms |
| stdev | 0.67ms |
| min | 26.30ms |
| max | 28.67ms |
| total | 548.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 26.44ms | 26.36ms | +0.08ms | +0.30% |
| p50 | 27.57ms | 27.80ms | -0.23ms | -0.84% |
| p95 | 28.67ms | 31.81ms | -3.14ms | -9.88% |
| p99 | 28.67ms | 33.49ms | -4.82ms | -14.39% |
| mean | 27.43ms | 28.55ms | -1.12ms | -3.91% |
| min | 26.30ms | 26.24ms | +0.06ms | +0.22% |
| max | 28.67ms | 33.91ms | -5.24ms | -15.45% |
| total | 548.61ms | 570.96ms | -22.35ms | -3.91% |

### error_retry_cycle (fail 3 job + assertFailed)

# Perf Report — error_retry_cycle (fail 3 job + assertFailed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 15.99ms |
| p50 | 16.34ms |
| p95 | 17.63ms |
| p99 | 18.76ms |
| mean | 16.69ms |
| stdev | 0.89ms |
| min | 14.78ms |
| max | 19.04ms |
| total | 333.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 15.99ms | 15.89ms | +0.10ms | +0.62% |
| p50 | 16.34ms | 16.40ms | -0.06ms | -0.35% |
| p95 | 17.63ms | 18.01ms | -0.38ms | -2.11% |
| p99 | 18.76ms | 18.54ms | +0.22ms | +1.19% |
| mean | 16.69ms | 16.69ms | +0.0022ms | +0.01% |
| min | 14.78ms | 15.48ms | -0.71ms | -4.56% |
| max | 19.04ms | 18.67ms | +0.37ms | +1.98% |
| total | 333.86ms | 333.82ms | +0.04ms | +0.01% |

