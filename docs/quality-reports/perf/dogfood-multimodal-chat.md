# Perf Suite — dogfood-multimodal-chat

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| describeImage | 8.69ms | 9.20ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| streamDescribeImage | 15.05ms | 16.29ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| compareImages | 8.49ms | 9.16ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| describeImage | 9.25ms | 60ms | PASS |
| streamDescribeImage | 16.63ms | 100ms | PASS |
| compareImages | 9.24ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| describeImage | -840 B | 0 B | 102400 B | yes | PASS |
| streamDescribeImage | -5032 B | 0 B | 102400 B | yes | PASS |
| compareImages | 2472 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### describeImage

# Perf Report — describeImage.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.69ms |
| p50 | 9.11ms |
| p95 | 9.20ms |
| p99 | 9.22ms |
| mean | 9.01ms |
| stdev | 0.27ms |
| min | 8.09ms |
| max | 9.23ms |
| total | 540.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.69ms | 8.18ms | +0.51ms | +6.20% |
| p50 | 9.11ms | 9.11ms | +0.0023ms | +0.03% |
| p95 | 9.20ms | 9.17ms | +0.03ms | +0.32% |
| p99 | 9.22ms | 9.21ms | +0.0071ms | +0.08% |
| mean | 9.01ms | 8.89ms | +0.12ms | +1.33% |
| min | 8.09ms | 7.99ms | +0.10ms | +1.29% |
| max | 9.23ms | 9.21ms | +0.01ms | +0.13% |
| total | 540.42ms | 533.35ms | +7.07ms | +1.33% |

### streamDescribeImage

# Perf Report — streamDescribeImage.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 15.05ms |
| p50 | 16.18ms |
| p95 | 16.29ms |
| p99 | 16.34ms |
| mean | 15.92ms |
| stdev | 0.55ms |
| min | 13.91ms |
| max | 16.34ms |
| total | 955.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 15.05ms | 15.04ms | +0.01ms | +0.09% |
| p50 | 16.18ms | 16.17ms | +0.01ms | +0.07% |
| p95 | 16.29ms | 16.36ms | -0.06ms | -0.39% |
| p99 | 16.34ms | 16.42ms | -0.08ms | -0.49% |
| mean | 15.92ms | 15.90ms | +0.02ms | +0.12% |
| min | 13.91ms | 14.64ms | -0.73ms | -5.02% |
| max | 16.34ms | 16.44ms | -0.09ms | -0.58% |
| total | 955.40ms | 954.21ms | +1.19ms | +0.12% |

### compareImages

# Perf Report — compareImages.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.49ms |
| p50 | 9.09ms |
| p95 | 9.16ms |
| p99 | 9.18ms |
| mean | 8.96ms |
| stdev | 0.28ms |
| min | 7.98ms |
| max | 9.18ms |
| total | 537.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.49ms | 8.39ms | +0.10ms | +1.14% |
| p50 | 9.09ms | 9.09ms | -0.0044ms | -0.05% |
| p95 | 9.16ms | 9.13ms | +0.03ms | +0.34% |
| p99 | 9.18ms | 9.20ms | -0.03ms | -0.29% |
| mean | 8.96ms | 8.93ms | +0.03ms | +0.33% |
| min | 7.98ms | 7.93ms | +0.05ms | +0.63% |
| max | 9.18ms | 9.30ms | -0.12ms | -1.26% |
| total | 537.80ms | 536.01ms | +1.79ms | +0.33% |

