# Perf Suite — dogfood-multimodal-chat

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| describeImage | 8.47ms | 9.21ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| streamDescribeImage | 15.01ms | 16.48ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| compareImages | 8.34ms | 9.17ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| describeImage | 9.24ms | 60ms | PASS |
| streamDescribeImage | 16.87ms | 100ms | PASS |
| compareImages | 9.22ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| describeImage | 168 B | 0 B | 102400 B | yes | PASS |
| streamDescribeImage | -6184 B | 0 B | 102400 B | yes | PASS |
| compareImages | 2376 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### describeImage

# Perf Report — describeImage.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.47ms |
| p50 | 9.12ms |
| p95 | 9.21ms |
| p99 | 9.23ms |
| mean | 9.00ms |
| stdev | 0.30ms |
| min | 7.97ms |
| max | 9.23ms |
| total | 539.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.47ms | 8.18ms | +0.29ms | +3.53% |
| p50 | 9.12ms | 9.11ms | +0.02ms | +0.17% |
| p95 | 9.21ms | 9.17ms | +0.04ms | +0.40% |
| p99 | 9.23ms | 9.21ms | +0.02ms | +0.24% |
| mean | 9.00ms | 8.89ms | +0.11ms | +1.21% |
| min | 7.97ms | 7.99ms | -0.02ms | -0.27% |
| max | 9.23ms | 9.21ms | +0.02ms | +0.23% |
| total | 539.82ms | 533.35ms | +6.48ms | +1.21% |

### streamDescribeImage

# Perf Report — streamDescribeImage.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 15.01ms |
| p50 | 16.23ms |
| p95 | 16.48ms |
| p99 | 18.67ms |
| mean | 16.02ms |
| stdev | 0.86ms |
| min | 14.03ms |
| max | 20.02ms |
| total | 961.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 15.01ms | 15.04ms | -0.03ms | -0.17% |
| p50 | 16.23ms | 16.17ms | +0.06ms | +0.36% |
| p95 | 16.48ms | 16.36ms | +0.12ms | +0.75% |
| p99 | 18.67ms | 16.42ms | +2.25ms | +13.73% |
| mean | 16.02ms | 15.90ms | +0.12ms | +0.74% |
| min | 14.03ms | 14.64ms | -0.61ms | -4.19% |
| max | 20.02ms | 16.44ms | +3.59ms | +21.83% |
| total | 961.25ms | 954.21ms | +7.04ms | +0.74% |

### compareImages

# Perf Report — compareImages.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.34ms |
| p50 | 9.10ms |
| p95 | 9.17ms |
| p99 | 9.22ms |
| mean | 8.96ms |
| stdev | 0.32ms |
| min | 7.94ms |
| max | 9.23ms |
| total | 537.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.34ms | 8.39ms | -0.05ms | -0.59% |
| p50 | 9.10ms | 9.09ms | +0.01ms | +0.16% |
| p95 | 9.17ms | 9.13ms | +0.04ms | +0.47% |
| p99 | 9.22ms | 9.20ms | +0.01ms | +0.15% |
| mean | 8.96ms | 8.93ms | +0.02ms | +0.26% |
| min | 7.94ms | 7.93ms | +0.01ms | +0.14% |
| max | 9.23ms | 9.30ms | -0.06ms | -0.68% |
| total | 537.37ms | 536.01ms | +1.37ms | +0.26% |

