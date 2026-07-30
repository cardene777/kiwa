# Perf Suite — dogfood-anthropic-chatbot

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| reply | 8.25ms | 9.24ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| replyStream | 14.20ms | 25.71ms | 50ms | 0.00033ms | PASS | stable (換算後 p10 -2% (閾値未満)、 p95 +61% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| toolLoop | 17.32ms | 19.89ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| reply | cpu | 0.08ms | 0.09ms | 8.25ms | 99.389 | 105.679 | 8.19ms | 8.71ms |
| replyStream | cpu | 0.08ms | 0.13ms | 14.20ms | 171.126 | 174.003 | 13.96ms | 14.19ms |
| toolLoop | cpu | 0.08ms | 0.14ms | 17.32ms | 208.354 | 207.771 | 17.31ms | 17.26ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| reply | 9.27ms | 60ms | PASS |
| replyStream | 16.96ms | 100ms | PASS |
| toolLoop | 18.32ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| reply | -1280 B | 0 B | 102400 B | yes | PASS |
| replyStream | -2624 B | 0 B | 102400 B | yes | PASS |
| toolLoop | -2360 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### reply

# Perf Report — reply.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.25ms |
| p50 | 9.13ms |
| p95 | 9.24ms |
| p99 | 9.38ms |
| mean | 8.95ms |
| stdev | 0.40ms |
| min | 7.42ms |
| max | 9.49ms |
| total | 536.86ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.993)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.19ms | 8.71ms | -0.52ms | -5.95% |
| p50 | 9.07ms | 9.13ms | -0.06ms | -0.62% |
| p95 | 9.17ms | 9.18ms | -0.0082ms | -0.09% |
| p99 | 9.31ms | 9.20ms | +0.11ms | +1.18% |
| mean | 8.89ms | 9.01ms | -0.13ms | -1.43% |
| min | 7.37ms | 7.37ms | +0.00020ms | +0.00% |
| max | 9.42ms | 9.22ms | +0.20ms | +2.20% |
| total | 533.14ms | 540.87ms | -7.72ms | -1.43% |

### replyStream

# Perf Report — replyStream.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 14.20ms |
| p50 | 15.48ms |
| p95 | 25.71ms |
| p99 | 29.08ms |
| mean | 16.22ms |
| stdev | 3.31ms |
| min | 13.40ms |
| max | 29.45ms |
| total | 973.04ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.983)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 13.96ms | 14.19ms | -0.23ms | -1.65% |
| p50 | 15.22ms | 15.07ms | +0.15ms | +0.97% |
| p95 | 25.28ms | 15.67ms | +9.61ms | +61.29% |
| p99 | 28.60ms | 16.42ms | +12.17ms | +74.13% |
| mean | 15.95ms | 15.01ms | +0.93ms | +6.22% |
| min | 13.18ms | 13.69ms | -0.51ms | -3.73% |
| max | 28.96ms | 16.95ms | +12.01ms | +70.84% |
| total | 956.83ms | 900.82ms | +56.01ms | +6.22% |

### toolLoop

# Perf Report — toolLoop.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 17.32ms |
| p50 | 18.16ms |
| p95 | 19.89ms |
| p99 | 45.44ms |
| mean | 19.12ms |
| stdev | 8.30ms |
| min | 15.97ms |
| max | 82.13ms |
| total | 1147.32ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.000)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 17.31ms | 17.26ms | +0.05ms | +0.28% |
| p50 | 18.15ms | 18.24ms | -0.08ms | -0.46% |
| p95 | 19.88ms | 19.93ms | -0.04ms | -0.22% |
| p99 | 45.42ms | 20.11ms | +25.31ms | +125.88% |
| mean | 19.11ms | 18.21ms | +0.91ms | +4.97% |
| min | 15.96ms | 15.73ms | +0.23ms | +1.44% |
| max | 82.10ms | 20.27ms | +61.83ms | +305.01% |
| total | 1146.85ms | 1092.50ms | +54.35ms | +4.97% |

