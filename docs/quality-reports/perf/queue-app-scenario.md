# Perf Suite — queue-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 4.63ms | 5.84ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| consumer_processing_with_return (5 addJob + assertProcessed) | 27.08ms | 28.81ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| error_retry_cycle (fail 3 job + assertFailed) | 16.24ms | 29.66ms | 200ms | 0.00050ms | PASS | stable (p10 +2% (閾値未満)、 p95 +65% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 5.90ms | 400ms | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 32.00ms | 400ms | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | 18.00ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | -14992 B | 0 B | 102400 B | yes | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 3616 B | 0 B | 102400 B | yes | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | -320 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### producer_burst (20 addJob + process + drain)

# Perf Report — producer_burst (20 addJob + process + drain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 4.63ms |
| p50 | 5.78ms |
| p95 | 5.84ms |
| p99 | 5.85ms |
| mean | 5.53ms |
| stdev | 0.53ms |
| min | 4.32ms |
| max | 5.85ms |
| total | 110.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 4.63ms | 5.03ms | -0.40ms | -7.86% |
| p50 | 5.78ms | 5.82ms | -0.04ms | -0.70% |
| p95 | 5.84ms | 9.66ms | -3.82ms | -39.55% |
| p99 | 5.85ms | 9.95ms | -4.10ms | -41.23% |
| mean | 5.53ms | 6.09ms | -0.56ms | -9.20% |
| min | 4.32ms | 4.59ms | -0.27ms | -5.90% |
| max | 5.85ms | 10.02ms | -4.17ms | -41.63% |
| total | 110.53ms | 121.73ms | -11.20ms | -9.20% |

### consumer_processing_with_return (5 addJob + assertProcessed)

# Perf Report — consumer_processing_with_return (5 addJob + assertProcessed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 27.08ms |
| p50 | 27.70ms |
| p95 | 28.81ms |
| p99 | 28.88ms |
| mean | 27.82ms |
| stdev | 0.66ms |
| min | 26.51ms |
| max | 28.90ms |
| total | 556.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 27.08ms | 26.36ms | +0.72ms | +2.74% |
| p50 | 27.70ms | 27.80ms | -0.10ms | -0.37% |
| p95 | 28.81ms | 31.81ms | -3.01ms | -9.45% |
| p99 | 28.88ms | 33.49ms | -4.61ms | -13.78% |
| mean | 27.82ms | 28.55ms | -0.73ms | -2.54% |
| min | 26.51ms | 26.24ms | +0.27ms | +1.03% |
| max | 28.90ms | 33.91ms | -5.02ms | -14.79% |
| total | 556.44ms | 570.96ms | -14.52ms | -2.54% |

### error_retry_cycle (fail 3 job + assertFailed)

# Perf Report — error_retry_cycle (fail 3 job + assertFailed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 16.24ms |
| p50 | 18.39ms |
| p95 | 29.66ms |
| p99 | 52.15ms |
| mean | 20.71ms |
| stdev | 9.16ms |
| min | 15.12ms |
| max | 57.77ms |
| total | 414.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 16.24ms | 15.89ms | +0.35ms | +2.23% |
| p50 | 18.39ms | 16.40ms | +1.99ms | +12.13% |
| p95 | 29.66ms | 18.01ms | +11.66ms | +64.74% |
| p99 | 52.15ms | 18.54ms | +33.61ms | +181.31% |
| mean | 20.71ms | 16.69ms | +4.01ms | +24.05% |
| min | 15.12ms | 15.48ms | -0.36ms | -2.34% |
| max | 57.77ms | 18.67ms | +39.10ms | +209.41% |
| total | 414.12ms | 333.82ms | +80.30ms | +24.05% |

