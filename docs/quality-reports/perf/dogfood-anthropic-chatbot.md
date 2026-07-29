# Perf Suite — dogfood-anthropic-chatbot

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| reply | 8.70ms | 10.13ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| replyStream | 15.46ms | 16.80ms | 50ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| toolLoop | 17.98ms | 22.08ms | 100ms | 0.00034ms | PASS | stable (p10 +4% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| reply | cpu | 0.08ms | 8.70ms | 106.994 | 105.608 | 8.69ms | 8.58ms |
| replyStream | cpu | 0.08ms | 15.46ms | 190.872 | 173.583 | 15.79ms | 14.36ms |
| toolLoop | cpu | 0.08ms | 17.98ms | 220.296 | 211.969 | 18.17ms | 17.48ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| reply | 10.25ms | 60ms | PASS |
| replyStream | 18.87ms | 100ms | PASS |
| toolLoop | 22.31ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| reply | -4416 B | 0 B | 102400 B | yes | PASS |
| replyStream | 4776 B | 0 B | 102400 B | yes | PASS |
| toolLoop | -2344 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### reply

# Perf Report — reply.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.70ms |
| p50 | 10.09ms |
| p95 | 10.13ms |
| p99 | 10.18ms |
| mean | 9.74ms |
| stdev | 0.65ms |
| min | 7.57ms |
| max | 10.21ms |
| total | 584.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.70ms | 8.58ms | +0.12ms | +1.41% |
| p50 | 10.09ms | 9.11ms | +0.98ms | +10.74% |
| p95 | 10.13ms | 9.19ms | +0.95ms | +10.29% |
| p99 | 10.18ms | 9.21ms | +0.98ms | +10.63% |
| mean | 9.74ms | 9.00ms | +0.74ms | +8.26% |
| min | 7.57ms | 8.21ms | -0.64ms | -7.80% |
| max | 10.21ms | 9.21ms | +1.00ms | +10.85% |
| total | 584.56ms | 539.94ms | +44.61ms | +8.26% |

### replyStream

# Perf Report — replyStream.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 15.46ms |
| p50 | 16.60ms |
| p95 | 16.80ms |
| p99 | 16.88ms |
| mean | 16.38ms |
| stdev | 0.52ms |
| min | 15.15ms |
| max | 16.89ms |
| total | 982.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 15.46ms | 14.36ms | +1.10ms | +7.68% |
| p50 | 16.60ms | 15.37ms | +1.23ms | +7.99% |
| p95 | 16.80ms | 18.46ms | -1.65ms | -8.97% |
| p99 | 16.88ms | 19.92ms | -3.04ms | -15.28% |
| mean | 16.38ms | 15.84ms | +0.54ms | +3.38% |
| min | 15.15ms | 13.96ms | +1.18ms | +8.47% |
| max | 16.89ms | 20.08ms | -3.18ms | -15.86% |
| total | 982.85ms | 950.70ms | +32.15ms | +3.38% |

### toolLoop

# Perf Report — toolLoop.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 17.98ms |
| p50 | 19.65ms |
| p95 | 22.08ms |
| p99 | 23.83ms |
| mean | 19.53ms |
| stdev | 1.38ms |
| min | 16.94ms |
| max | 24.25ms |
| total | 1172.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 17.98ms | 17.48ms | +0.49ms | +2.83% |
| p50 | 19.65ms | 18.21ms | +1.44ms | +7.91% |
| p95 | 22.08ms | 18.39ms | +3.68ms | +20.02% |
| p99 | 23.83ms | 18.67ms | +5.15ms | +27.60% |
| mean | 19.53ms | 17.97ms | +1.57ms | +8.73% |
| min | 16.94ms | 15.22ms | +1.72ms | +11.31% |
| max | 24.25ms | 18.81ms | +5.43ms | +28.86% |
| total | 1172.07ms | 1078.00ms | +94.07ms | +8.73% |

