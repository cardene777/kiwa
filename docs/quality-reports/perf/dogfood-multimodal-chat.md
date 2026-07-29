# Perf Suite — dogfood-multimodal-chat

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| describeImage | 8.48ms | 9.25ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| streamDescribeImage | 15.17ms | 16.83ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| compareImages | 8.39ms | 9.13ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| describeImage | 9.31ms | 60ms | PASS |
| streamDescribeImage | 16.73ms | 100ms | PASS |
| compareImages | 9.17ms | 80ms | PASS |

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
| p10 | 8.48ms |
| p50 | 9.13ms |
| p95 | 9.25ms |
| p99 | 9.38ms |
| mean | 8.99ms |
| stdev | 0.31ms |
| min | 8.02ms |
| max | 9.54ms |
| total | 539.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.48ms | 8.18ms | +0.30ms | +3.61% |
| p50 | 9.13ms | 9.11ms | +0.02ms | +0.27% |
| p95 | 9.25ms | 9.17ms | +0.08ms | +0.89% |
| p99 | 9.38ms | 9.21ms | +0.17ms | +1.85% |
| mean | 8.99ms | 8.89ms | +0.10ms | +1.09% |
| min | 8.02ms | 7.99ms | +0.03ms | +0.42% |
| max | 9.54ms | 9.21ms | +0.33ms | +3.53% |
| total | 539.15ms | 533.35ms | +5.80ms | +1.09% |

### streamDescribeImage

# Perf Report — streamDescribeImage.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 15.17ms |
| p50 | 16.25ms |
| p95 | 16.83ms |
| p99 | 18.10ms |
| mean | 16.13ms |
| stdev | 0.62ms |
| min | 14.78ms |
| max | 18.20ms |
| total | 967.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 15.17ms | 15.04ms | +0.14ms | +0.90% |
| p50 | 16.25ms | 16.17ms | +0.08ms | +0.52% |
| p95 | 16.83ms | 16.36ms | +0.47ms | +2.89% |
| p99 | 18.10ms | 16.42ms | +1.68ms | +10.20% |
| mean | 16.13ms | 15.90ms | +0.22ms | +1.41% |
| min | 14.78ms | 14.64ms | +0.14ms | +0.94% |
| max | 18.20ms | 16.44ms | +1.77ms | +10.74% |
| total | 967.62ms | 954.21ms | +13.41ms | +1.41% |

### compareImages

# Perf Report — compareImages.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.39ms |
| p50 | 9.09ms |
| p95 | 9.13ms |
| p99 | 9.15ms |
| mean | 8.95ms |
| stdev | 0.31ms |
| min | 7.98ms |
| max | 9.15ms |
| total | 536.87ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.39ms | 8.39ms | -0.0050ms | -0.06% |
| p50 | 9.09ms | 9.09ms | +0.0043ms | +0.05% |
| p95 | 9.13ms | 9.13ms | +0.0066ms | +0.07% |
| p99 | 9.15ms | 9.20ms | -0.06ms | -0.64% |
| mean | 8.95ms | 8.93ms | +0.01ms | +0.16% |
| min | 7.98ms | 7.93ms | +0.05ms | +0.68% |
| max | 9.15ms | 9.30ms | -0.14ms | -1.53% |
| total | 536.87ms | 536.01ms | +0.86ms | +0.16% |

