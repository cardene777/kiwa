# Perf Suite — queue-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 5.14ms | 6.61ms | 200ms | 0.00055ms | PASS | stable (p10 +23% (閾値未満)、 p95 +26% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| consumer_processing_with_return (5 addJob + assertProcessed) | 28.00ms | 35.02ms | 200ms | 0.00049ms | PASS | stable (p10 +6% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| error_retry_cycle (fail 3 job + assertFailed) | 16.69ms | 18.92ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | cpu | 0.08ms | 5.14ms | 62.252 | 50.750 | 5.69ms | 4.64ms |
| consumer_processing_with_return (5 addJob + assertProcessed) | cpu | 0.08ms | 28.00ms | 336.134 | 315.745 | 27.72ms | 26.04ms |
| error_retry_cycle (fail 3 job + assertFailed) | cpu | 0.08ms | 16.69ms | 201.705 | 197.649 | 16.46ms | 16.13ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 6.53ms | 400ms | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 29.74ms | 400ms | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | 19.58ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | -14920 B | 0 B | 102400 B | yes | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 6384 B | 0 B | 102400 B | yes | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | -288 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### producer_burst (20 addJob + process + drain)

# Perf Report — producer_burst (20 addJob + process + drain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 5.14ms |
| p50 | 6.02ms |
| p95 | 6.61ms |
| p99 | 7.00ms |
| mean | 5.95ms |
| stdev | 0.63ms |
| min | 4.68ms |
| max | 7.10ms |
| total | 119.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 5.14ms | 4.64ms | +0.51ms | +10.92% |
| p50 | 6.02ms | 5.74ms | +0.28ms | +4.93% |
| p95 | 6.61ms | 5.79ms | +0.81ms | +14.01% |
| p99 | 7.00ms | 5.80ms | +1.20ms | +20.73% |
| mean | 5.95ms | 5.51ms | +0.44ms | +8.00% |
| min | 4.68ms | 4.59ms | +0.10ms | +2.17% |
| max | 7.10ms | 5.80ms | +1.30ms | +22.40% |
| total | 119.09ms | 110.27ms | +8.82ms | +8.00% |

### consumer_processing_with_return (5 addJob + assertProcessed)

# Perf Report — consumer_processing_with_return (5 addJob + assertProcessed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 28.00ms |
| p50 | 29.68ms |
| p95 | 35.02ms |
| p99 | 42.02ms |
| mean | 30.51ms |
| stdev | 3.56ms |
| min | 27.59ms |
| max | 43.78ms |
| total | 610.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 28.00ms | 26.04ms | +1.97ms | +7.56% |
| p50 | 29.68ms | 27.54ms | +2.14ms | +7.77% |
| p95 | 35.02ms | 28.54ms | +6.48ms | +22.70% |
| p99 | 42.02ms | 28.71ms | +13.32ms | +46.40% |
| mean | 30.51ms | 27.37ms | +3.14ms | +11.47% |
| min | 27.59ms | 25.97ms | +1.62ms | +6.24% |
| max | 43.78ms | 28.75ms | +15.03ms | +52.27% |
| total | 610.18ms | 547.40ms | +62.78ms | +11.47% |

### error_retry_cycle (fail 3 job + assertFailed)

# Perf Report — error_retry_cycle (fail 3 job + assertFailed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 16.69ms |
| p50 | 17.72ms |
| p95 | 18.92ms |
| p99 | 19.33ms |
| mean | 17.57ms |
| stdev | 1.01ms |
| min | 14.96ms |
| max | 19.43ms |
| total | 351.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 16.69ms | 16.13ms | +0.56ms | +3.50% |
| p50 | 17.72ms | 16.24ms | +1.48ms | +9.10% |
| p95 | 18.92ms | 17.35ms | +1.57ms | +9.07% |
| p99 | 19.33ms | 17.52ms | +1.80ms | +10.29% |
| mean | 17.57ms | 16.60ms | +0.97ms | +5.82% |
| min | 14.96ms | 15.54ms | -0.58ms | -3.72% |
| max | 19.43ms | 17.57ms | +1.86ms | +10.59% |
| total | 351.36ms | 332.04ms | +19.32ms | +5.82% |

