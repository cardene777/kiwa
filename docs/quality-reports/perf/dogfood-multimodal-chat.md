# Perf Suite — dogfood-multimodal-chat

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| describeImage | 8.33ms | 9.40ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| streamDescribeImage | 15.55ms | 19.49ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| compareImages | 8.52ms | 12.96ms | 40ms | 0.00033ms | PASS | stable (p10 +1% (閾値未満)、 p95 +42% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| describeImage | 10.26ms | 60ms | PASS |
| streamDescribeImage | 21.29ms | 100ms | PASS |
| compareImages | 10.93ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| describeImage | -424 B | 0 B | 102400 B | yes | PASS |
| streamDescribeImage | -6360 B | 0 B | 102400 B | yes | PASS |
| compareImages | 2472 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### describeImage

# Perf Report — describeImage.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.33ms |
| p50 | 9.14ms |
| p95 | 9.40ms |
| p99 | 9.57ms |
| mean | 8.95ms |
| stdev | 0.45ms |
| min | 7.39ms |
| max | 9.62ms |
| total | 537.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.33ms | 8.18ms | +0.15ms | +1.77% |
| p50 | 9.14ms | 9.11ms | +0.03ms | +0.38% |
| p95 | 9.40ms | 9.17ms | +0.23ms | +2.46% |
| p99 | 9.57ms | 9.21ms | +0.36ms | +3.90% |
| mean | 8.95ms | 8.89ms | +0.06ms | +0.71% |
| min | 7.39ms | 7.99ms | -0.60ms | -7.54% |
| max | 9.62ms | 9.21ms | +0.40ms | +4.38% |
| total | 537.12ms | 533.35ms | +3.77ms | +0.71% |

### streamDescribeImage

# Perf Report — streamDescribeImage.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 15.55ms |
| p50 | 16.55ms |
| p95 | 19.49ms |
| p99 | 22.68ms |
| mean | 16.87ms |
| stdev | 1.56ms |
| min | 14.25ms |
| max | 24.32ms |
| total | 1012.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 15.55ms | 15.04ms | +0.52ms | +3.44% |
| p50 | 16.55ms | 16.17ms | +0.38ms | +2.36% |
| p95 | 19.49ms | 16.36ms | +3.13ms | +19.16% |
| p99 | 22.68ms | 16.42ms | +6.26ms | +38.13% |
| mean | 16.87ms | 15.90ms | +0.97ms | +6.07% |
| min | 14.25ms | 14.64ms | -0.40ms | -2.70% |
| max | 24.32ms | 16.44ms | +7.88ms | +47.94% |
| total | 1012.11ms | 954.21ms | +57.90ms | +6.07% |

### compareImages

# Perf Report — compareImages.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.52ms |
| p50 | 9.44ms |
| p95 | 12.96ms |
| p99 | 14.73ms |
| mean | 9.87ms |
| stdev | 1.46ms |
| min | 7.94ms |
| max | 15.27ms |
| total | 592.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.52ms | 8.39ms | +0.12ms | +1.47% |
| p50 | 9.44ms | 9.09ms | +0.35ms | +3.87% |
| p95 | 12.96ms | 9.13ms | +3.83ms | +42.00% |
| p99 | 14.73ms | 9.20ms | +5.53ms | +60.07% |
| mean | 9.87ms | 8.93ms | +0.93ms | +10.45% |
| min | 7.94ms | 7.93ms | +0.01ms | +0.15% |
| max | 15.27ms | 9.30ms | +5.97ms | +64.21% |
| total | 592.05ms | 536.01ms | +56.04ms | +10.45% |

