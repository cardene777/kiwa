# Perf Suite — dogfood-multimodal-chat

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| describeImage | 8.19ms | 10.11ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| streamDescribeImage | 15.92ms | 19.34ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| compareImages | 8.41ms | 10.11ms | 40ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| describeImage | cpu | 0.08ms | 8.19ms | 98.832 | 101.542 | 8.15ms | 8.37ms |
| streamDescribeImage | cpu | 0.08ms | 15.92ms | 192.542 | 183.147 | 15.91ms | 15.14ms |
| compareImages | cpu | 0.08ms | 8.41ms | 103.222 | 100.140 | 8.58ms | 8.32ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| describeImage | 10.17ms | 60ms | PASS |
| streamDescribeImage | 18.70ms | 100ms | PASS |
| compareImages | 10.15ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| describeImage | 6384 B | 0 B | 102400 B | yes | PASS |
| streamDescribeImage | -5888 B | 0 B | 102400 B | yes | PASS |
| compareImages | 2504 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### describeImage

# Perf Report — describeImage.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.19ms |
| p50 | 8.67ms |
| p95 | 10.11ms |
| p99 | 10.58ms |
| mean | 8.86ms |
| stdev | 0.72ms |
| min | 7.79ms |
| max | 11.12ms |
| total | 531.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.19ms | 8.37ms | -0.18ms | -2.17% |
| p50 | 8.67ms | 9.11ms | -0.44ms | -4.81% |
| p95 | 10.11ms | 9.16ms | +0.95ms | +10.40% |
| p99 | 10.58ms | 9.17ms | +1.41ms | +15.35% |
| mean | 8.86ms | 8.92ms | -0.06ms | -0.65% |
| min | 7.79ms | 7.94ms | -0.15ms | -1.94% |
| max | 11.12ms | 9.18ms | +1.94ms | +21.16% |
| total | 531.49ms | 534.96ms | -3.47ms | -0.65% |

### streamDescribeImage

# Perf Report — streamDescribeImage.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 15.92ms |
| p50 | 16.97ms |
| p95 | 19.34ms |
| p99 | 24.54ms |
| mean | 17.20ms |
| stdev | 1.81ms |
| min | 14.83ms |
| max | 27.13ms |
| total | 1031.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 15.92ms | 15.14ms | +0.79ms | +5.19% |
| p50 | 16.97ms | 16.20ms | +0.77ms | +4.74% |
| p95 | 19.34ms | 16.32ms | +3.03ms | +18.55% |
| p99 | 24.54ms | 16.40ms | +8.14ms | +49.66% |
| mean | 17.20ms | 15.96ms | +1.24ms | +7.74% |
| min | 14.83ms | 13.99ms | +0.84ms | +5.99% |
| max | 27.13ms | 16.43ms | +10.69ms | +65.08% |
| total | 1031.82ms | 957.70ms | +74.11ms | +7.74% |

### compareImages

# Perf Report — compareImages.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.41ms |
| p50 | 10.07ms |
| p95 | 10.11ms |
| p99 | 10.73ms |
| mean | 9.58ms |
| stdev | 0.75ms |
| min | 8.16ms |
| max | 11.59ms |
| total | 574.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.41ms | 8.32ms | +0.09ms | +1.11% |
| p50 | 10.07ms | 9.11ms | +0.96ms | +10.53% |
| p95 | 10.11ms | 9.75ms | +0.36ms | +3.72% |
| p99 | 10.73ms | 9.96ms | +0.77ms | +7.68% |
| mean | 9.58ms | 9.01ms | +0.57ms | +6.34% |
| min | 8.16ms | 7.92ms | +0.25ms | +3.12% |
| max | 11.59ms | 10.11ms | +1.49ms | +14.71% |
| total | 574.54ms | 540.31ms | +34.23ms | +6.34% |

