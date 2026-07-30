# Perf Suite — dogfood-multimodal-chat

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| describeImage | 8.50ms | 10.25ms | 30ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |
| streamDescribeImage | 16.93ms | 26.74ms | 50ms | 0.00031ms | PASS | stable (換算後 p10 +3% (閾値未満)、 p95 +48% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| compareImages | 8.28ms | 10.16ms | 40ms | 0.00030ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| describeImage | cpu | 0.09ms | 0.26ms | 8.50ms | 92.740 | 97.424 | 8.04ms | 8.45ms |
| streamDescribeImage | cpu | 0.09ms | 0.20ms | 16.93ms | 188.682 | 183.152 | 15.60ms | 15.14ms |
| compareImages | cpu | 0.09ms | 0.23ms | 8.28ms | 91.171 | 103.827 | 7.44ms | 8.48ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| describeImage | 9.88ms | 60ms | PASS |
| streamDescribeImage | 23.74ms | 100ms | PASS |
| compareImages | 12.47ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| describeImage | 6096 B | 0 B | 102400 B | yes | PASS |
| streamDescribeImage | -6440 B | 0 B | 102400 B | yes | PASS |
| compareImages | 2600 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### describeImage

# Perf Report — describeImage.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.50ms |
| p50 | 9.27ms |
| p95 | 10.25ms |
| p99 | 10.95ms |
| mean | 9.31ms |
| stdev | 0.60ms |
| min | 7.51ms |
| max | 11.11ms |
| total | 558.76ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.947)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.04ms | 8.45ms | -0.41ms | -4.81% |
| p50 | 8.78ms | 9.14ms | -0.35ms | -3.87% |
| p95 | 9.71ms | 9.33ms | +0.38ms | +4.10% |
| p99 | 10.36ms | 9.65ms | +0.71ms | +7.39% |
| mean | 8.82ms | 9.01ms | -0.20ms | -2.17% |
| min | 7.11ms | 8.20ms | -1.09ms | -13.27% |
| max | 10.52ms | 9.72ms | +0.79ms | +8.16% |
| total | 529.12ms | 540.87ms | -11.75ms | -2.17% |

### streamDescribeImage

# Perf Report — streamDescribeImage.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 16.93ms |
| p50 | 20.05ms |
| p95 | 26.74ms |
| p99 | 59.63ms |
| mean | 21.41ms |
| stdev | 8.21ms |
| min | 15.24ms |
| max | 70.96ms |
| total | 1284.32ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.921)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 15.60ms | 15.14ms | +0.46ms | +3.02% |
| p50 | 18.47ms | 16.23ms | +2.24ms | +13.78% |
| p95 | 24.63ms | 16.65ms | +7.97ms | +47.89% |
| p99 | 54.93ms | 17.78ms | +37.15ms | +209.01% |
| mean | 19.72ms | 16.04ms | +3.68ms | +22.92% |
| min | 14.04ms | 13.95ms | +0.09ms | +0.62% |
| max | 65.37ms | 17.88ms | +47.49ms | +265.57% |
| total | 1183.07ms | 962.45ms | +220.62ms | +22.92% |

### compareImages

# Perf Report — compareImages.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.28ms |
| p50 | 8.97ms |
| p95 | 10.16ms |
| p99 | 12.34ms |
| mean | 9.03ms |
| stdev | 0.99ms |
| min | 7.51ms |
| max | 14.44ms |
| total | 542.02ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.899)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 7.44ms | 8.48ms | -1.03ms | -12.19% |
| p50 | 8.07ms | 9.10ms | -1.03ms | -11.27% |
| p95 | 9.14ms | 9.16ms | -0.02ms | -0.21% |
| p99 | 11.10ms | 9.53ms | +1.56ms | +16.42% |
| mean | 8.12ms | 8.93ms | -0.80ms | -9.01% |
| min | 6.76ms | 7.39ms | -0.64ms | -8.63% |
| max | 12.98ms | 10.01ms | +2.97ms | +29.70% |
| total | 487.45ms | 535.74ms | -48.29ms | -9.01% |

