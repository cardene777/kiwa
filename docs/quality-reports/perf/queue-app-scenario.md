# Perf Suite — queue-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 5.59ms | 5.97ms | 200ms | 0.00056ms | PASS | regressed — gate 無効 (regressionGate=false) |
| consumer_processing_with_return (5 addJob + assertProcessed) | 26.16ms | 29.85ms | 200ms | 0.00047ms | PASS | stable — gate 無効 (regressionGate=false) |
| error_retry_cycle (fail 3 job + assertFailed) | 15.54ms | 18.62ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | cpu | 0.09ms | 0.13ms | 5.59ms | 64.099 | 52.765 | 6.30ms | 5.19ms |
| consumer_processing_with_return (5 addJob + assertProcessed) | cpu | 0.09ms | 0.12ms | 26.16ms | 299.024 | 339.392 | 24.66ms | 27.99ms |
| error_retry_cycle (fail 3 job + assertFailed) | cpu | 0.08ms | 0.21ms | 15.54ms | 186.616 | 205.291 | 15.44ms | 16.99ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 6.07ms | 400ms | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 27.75ms | 400ms | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | 17.57ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | -13352 B | 0 B | 102400 B | yes | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 3648 B | 0 B | 102400 B | yes | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | -288 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### producer_burst (20 addJob + process + drain)

# Perf Report — producer_burst (20 addJob + process + drain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 5.59ms |
| p50 | 5.86ms |
| p95 | 5.97ms |
| p99 | 5.98ms |
| mean | 5.79ms |
| stdev | 0.27ms |
| min | 4.76ms |
| max | 5.99ms |
| total | 115.75ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.127)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 6.30ms | 5.19ms | +1.11ms | +21.48% |
| p50 | 6.60ms | 6.43ms | +0.17ms | +2.64% |
| p95 | 6.72ms | 6.49ms | +0.24ms | +3.65% |
| p99 | 6.74ms | 6.52ms | +0.22ms | +3.35% |
| mean | 6.52ms | 5.98ms | +0.54ms | +8.98% |
| min | 5.36ms | 4.57ms | +0.79ms | +17.30% |
| max | 6.75ms | 6.53ms | +0.21ms | +3.28% |
| total | 130.43ms | 119.68ms | +10.75ms | +8.98% |

### consumer_processing_with_return (5 addJob + assertProcessed)

# Perf Report — consumer_processing_with_return (5 addJob + assertProcessed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 26.16ms |
| p50 | 27.72ms |
| p95 | 29.85ms |
| p99 | 29.98ms |
| mean | 27.83ms |
| stdev | 1.23ms |
| min | 25.83ms |
| max | 30.01ms |
| total | 556.58ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.943)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 24.66ms | 27.99ms | -3.33ms | -11.89% |
| p50 | 26.13ms | 29.32ms | -3.19ms | -10.87% |
| p95 | 28.14ms | 30.59ms | -2.45ms | -8.00% |
| p99 | 28.26ms | 30.69ms | -2.42ms | -7.90% |
| mean | 26.23ms | 29.15ms | -2.92ms | -10.02% |
| min | 24.35ms | 26.86ms | -2.51ms | -9.33% |
| max | 28.29ms | 30.71ms | -2.42ms | -7.88% |
| total | 524.66ms | 583.06ms | -58.40ms | -10.02% |

### error_retry_cycle (fail 3 job + assertFailed)

# Perf Report — error_retry_cycle (fail 3 job + assertFailed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 15.54ms |
| p50 | 16.41ms |
| p95 | 18.62ms |
| p99 | 19.16ms |
| mean | 16.78ms |
| stdev | 1.12ms |
| min | 15.17ms |
| max | 19.30ms |
| total | 335.69ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.994)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 15.44ms | 16.99ms | -1.55ms | -9.10% |
| p50 | 16.31ms | 17.94ms | -1.63ms | -9.10% |
| p95 | 18.50ms | 18.77ms | -0.26ms | -1.41% |
| p99 | 19.04ms | 19.17ms | -0.12ms | -0.65% |
| mean | 16.68ms | 17.81ms | -1.14ms | -6.38% |
| min | 15.07ms | 15.06ms | +0.0057ms | +0.04% |
| max | 19.17ms | 19.27ms | -0.09ms | -0.47% |
| total | 333.54ms | 356.27ms | -22.73ms | -6.38% |

