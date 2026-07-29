# Perf Suite — dogfood-multimodal-chat

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| describeImage | 8.34ms | 9.22ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| streamDescribeImage | 15.17ms | 19.49ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| compareImages | 8.55ms | 9.18ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| describeImage | 9.50ms | 60ms | PASS |
| streamDescribeImage | 21.16ms | 100ms | PASS |
| compareImages | 9.18ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| describeImage | -1176 B | 0 B | 102400 B | yes | PASS |
| streamDescribeImage | -6344 B | 0 B | 102400 B | yes | PASS |
| compareImages | 2472 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### describeImage

# Perf Report — describeImage.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.34ms |
| p50 | 9.13ms |
| p95 | 9.22ms |
| p99 | 9.28ms |
| mean | 8.96ms |
| stdev | 0.37ms |
| min | 7.71ms |
| max | 9.31ms |
| total | 537.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.34ms | 8.18ms | +0.16ms | +1.93% |
| p50 | 9.13ms | 9.11ms | +0.02ms | +0.22% |
| p95 | 9.22ms | 9.17ms | +0.05ms | +0.54% |
| p99 | 9.28ms | 9.21ms | +0.07ms | +0.72% |
| mean | 8.96ms | 8.89ms | +0.07ms | +0.76% |
| min | 7.71ms | 7.99ms | -0.29ms | -3.58% |
| max | 9.31ms | 9.21ms | +0.10ms | +1.10% |
| total | 537.39ms | 533.35ms | +4.04ms | +0.76% |

### streamDescribeImage

# Perf Report — streamDescribeImage.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 15.17ms |
| p50 | 16.33ms |
| p95 | 19.49ms |
| p99 | 22.39ms |
| mean | 16.67ms |
| stdev | 1.64ms |
| min | 14.35ms |
| max | 25.49ms |
| total | 999.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 15.17ms | 15.04ms | +0.13ms | +0.86% |
| p50 | 16.33ms | 16.17ms | +0.17ms | +1.03% |
| p95 | 19.49ms | 16.36ms | +3.13ms | +19.12% |
| p99 | 22.39ms | 16.42ms | +5.97ms | +36.35% |
| mean | 16.67ms | 15.90ms | +0.76ms | +4.79% |
| min | 14.35ms | 14.64ms | -0.29ms | -2.00% |
| max | 25.49ms | 16.44ms | +9.06ms | +55.11% |
| total | 999.90ms | 954.21ms | +45.69ms | +4.79% |

### compareImages

# Perf Report — compareImages.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.55ms |
| p50 | 9.10ms |
| p95 | 9.18ms |
| p99 | 9.31ms |
| mean | 9.00ms |
| stdev | 0.26ms |
| min | 8.16ms |
| max | 9.36ms |
| total | 540.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.55ms | 8.39ms | +0.16ms | +1.92% |
| p50 | 9.10ms | 9.09ms | +0.0081ms | +0.09% |
| p95 | 9.18ms | 9.13ms | +0.06ms | +0.64% |
| p99 | 9.31ms | 9.20ms | +0.11ms | +1.19% |
| mean | 9.00ms | 8.93ms | +0.07ms | +0.77% |
| min | 8.16ms | 7.93ms | +0.24ms | +2.97% |
| max | 9.36ms | 9.30ms | +0.06ms | +0.66% |
| total | 540.15ms | 536.01ms | +4.14ms | +0.77% |

