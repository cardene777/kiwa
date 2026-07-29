# Perf Suite — dogfood-multimodal-chat

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| describeImage | 8.62ms | 9.18ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| streamDescribeImage | 15.17ms | 16.69ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| compareImages | 8.32ms | 9.12ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| describeImage | 9.93ms | 60ms | PASS |
| streamDescribeImage | 22.35ms | 100ms | PASS |
| compareImages | 9.19ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| describeImage | -872 B | 0 B | 102400 B | yes | PASS |
| streamDescribeImage | -6296 B | 0 B | 102400 B | yes | PASS |
| compareImages | 1336 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### describeImage

# Perf Report — describeImage.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.62ms |
| p50 | 9.12ms |
| p95 | 9.18ms |
| p99 | 9.23ms |
| mean | 8.98ms |
| stdev | 0.29ms |
| min | 8.01ms |
| max | 9.23ms |
| total | 538.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.62ms | 8.18ms | +0.44ms | +5.41% |
| p50 | 9.12ms | 9.11ms | +0.01ms | +0.15% |
| p95 | 9.18ms | 9.17ms | +0.0028ms | +0.03% |
| p99 | 9.23ms | 9.21ms | +0.02ms | +0.18% |
| mean | 8.98ms | 8.89ms | +0.09ms | +0.98% |
| min | 8.01ms | 7.99ms | +0.02ms | +0.22% |
| max | 9.23ms | 9.21ms | +0.02ms | +0.17% |
| total | 538.55ms | 533.35ms | +5.21ms | +0.98% |

### streamDescribeImage

# Perf Report — streamDescribeImage.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 15.17ms |
| p50 | 16.24ms |
| p95 | 16.69ms |
| p99 | 21.51ms |
| mean | 16.24ms |
| stdev | 1.53ms |
| min | 14.94ms |
| max | 27.18ms |
| total | 974.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 15.17ms | 15.04ms | +0.13ms | +0.90% |
| p50 | 16.24ms | 16.17ms | +0.07ms | +0.42% |
| p95 | 16.69ms | 16.36ms | +0.33ms | +2.03% |
| p99 | 21.51ms | 16.42ms | +5.09ms | +30.99% |
| mean | 16.24ms | 15.90ms | +0.34ms | +2.11% |
| min | 14.94ms | 14.64ms | +0.29ms | +2.01% |
| max | 27.18ms | 16.44ms | +10.74ms | +65.37% |
| total | 974.36ms | 954.21ms | +20.15ms | +2.11% |

### compareImages

# Perf Report — compareImages.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.32ms |
| p50 | 9.10ms |
| p95 | 9.12ms |
| p99 | 9.14ms |
| mean | 8.93ms |
| stdev | 0.32ms |
| min | 8.10ms |
| max | 9.16ms |
| total | 535.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.32ms | 8.39ms | -0.07ms | -0.86% |
| p50 | 9.10ms | 9.09ms | +0.0061ms | +0.07% |
| p95 | 9.12ms | 9.13ms | -0.0021ms | -0.02% |
| p99 | 9.14ms | 9.20ms | -0.06ms | -0.65% |
| mean | 8.93ms | 8.93ms | -0.0041ms | -0.05% |
| min | 8.10ms | 7.93ms | +0.18ms | +2.21% |
| max | 9.16ms | 9.30ms | -0.14ms | -1.48% |
| total | 535.76ms | 536.01ms | -0.25ms | -0.05% |

