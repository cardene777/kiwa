# Perf Suite — dogfood-multimodal-chat

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| describeImage | 8.47ms | 10.18ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| streamDescribeImage | 16.76ms | 18.18ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| compareImages | 8.83ms | 10.15ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| describeImage | 10.73ms | 60ms | PASS |
| streamDescribeImage | 18.38ms | 100ms | PASS |
| compareImages | 10.20ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| describeImage | -824 B | 0 B | 102400 B | yes | PASS |
| streamDescribeImage | -4840 B | 0 B | 102400 B | yes | PASS |
| compareImages | 2472 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### describeImage

# Perf Report — describeImage.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.47ms |
| p50 | 10.03ms |
| p95 | 10.18ms |
| p99 | 10.21ms |
| mean | 9.63ms |
| stdev | 0.71ms |
| min | 7.29ms |
| max | 10.21ms |
| total | 577.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.47ms | 8.18ms | +0.29ms | +3.56% |
| p50 | 10.03ms | 9.11ms | +0.92ms | +10.09% |
| p95 | 10.18ms | 9.17ms | +1.00ms | +10.95% |
| p99 | 10.21ms | 9.21ms | +1.00ms | +10.82% |
| mean | 9.63ms | 8.89ms | +0.74ms | +8.33% |
| min | 7.29ms | 7.99ms | -0.70ms | -8.72% |
| max | 10.21ms | 9.21ms | +1.00ms | +10.80% |
| total | 577.78ms | 533.35ms | +44.43ms | +8.33% |

### streamDescribeImage

# Perf Report — streamDescribeImage.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 16.76ms |
| p50 | 17.96ms |
| p95 | 18.18ms |
| p99 | 18.35ms |
| mean | 17.69ms |
| stdev | 0.61ms |
| min | 15.46ms |
| max | 18.48ms |
| total | 1061.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 16.76ms | 15.04ms | +1.72ms | +11.44% |
| p50 | 17.96ms | 16.17ms | +1.80ms | +11.10% |
| p95 | 18.18ms | 16.36ms | +1.82ms | +11.15% |
| p99 | 18.35ms | 16.42ms | +1.93ms | +11.74% |
| mean | 17.69ms | 15.90ms | +1.79ms | +11.23% |
| min | 15.46ms | 14.64ms | +0.82ms | +5.59% |
| max | 18.48ms | 16.44ms | +2.05ms | +12.45% |
| total | 1061.38ms | 954.21ms | +107.17ms | +11.23% |

### compareImages

# Perf Report — compareImages.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.83ms |
| p50 | 10.06ms |
| p95 | 10.15ms |
| p99 | 10.19ms |
| mean | 9.68ms |
| stdev | 0.58ms |
| min | 8.29ms |
| max | 10.21ms |
| total | 581.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.83ms | 8.39ms | +0.44ms | +5.24% |
| p50 | 10.06ms | 9.09ms | +0.97ms | +10.65% |
| p95 | 10.15ms | 9.13ms | +1.02ms | +11.16% |
| p99 | 10.19ms | 9.20ms | +0.99ms | +10.73% |
| mean | 9.68ms | 8.93ms | +0.75ms | +8.41% |
| min | 8.29ms | 7.93ms | +0.37ms | +4.61% |
| max | 10.21ms | 9.30ms | +0.91ms | +9.81% |
| total | 581.08ms | 536.01ms | +45.07ms | +8.41% |

