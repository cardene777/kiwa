# Perf Suite — dogfood-anthropic-chatbot

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| reply | 8.51ms | 10.18ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| replyStream | 15.41ms | 18.37ms | 50ms | 0.00033ms | PASS | stable (p10 +11% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| toolLoop | 17.94ms | 20.31ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| reply | 10.99ms | 60ms | PASS |
| replyStream | 16.94ms | 100ms | PASS |
| toolLoop | 20.39ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| reply | -752 B | 0 B | 102400 B | yes | PASS |
| replyStream | -3984 B | 0 B | 102400 B | yes | PASS |
| toolLoop | -3544 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### reply

# Perf Report — reply.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.51ms |
| p50 | 10.13ms |
| p95 | 10.18ms |
| p99 | 10.22ms |
| mean | 9.75ms |
| stdev | 0.68ms |
| min | 7.71ms |
| max | 10.24ms |
| total | 584.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.51ms | 8.31ms | +0.20ms | +2.41% |
| p50 | 10.13ms | 9.11ms | +1.02ms | +11.23% |
| p95 | 10.18ms | 9.17ms | +1.01ms | +11.07% |
| p99 | 10.22ms | 9.27ms | +0.95ms | +10.25% |
| mean | 9.75ms | 8.91ms | +0.84ms | +9.43% |
| min | 7.71ms | 8.02ms | -0.31ms | -3.88% |
| max | 10.24ms | 9.34ms | +0.89ms | +9.57% |
| total | 584.89ms | 534.48ms | +50.40ms | +9.43% |

### replyStream

# Perf Report — replyStream.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 15.41ms |
| p50 | 16.75ms |
| p95 | 18.37ms |
| p99 | 20.65ms |
| mean | 16.78ms |
| stdev | 1.08ms |
| min | 14.95ms |
| max | 20.98ms |
| total | 1006.99ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 15.41ms | 13.94ms | +1.47ms | +10.56% |
| p50 | 16.75ms | 15.01ms | +1.74ms | +11.59% |
| p95 | 18.37ms | 15.12ms | +3.25ms | +21.49% |
| p99 | 20.65ms | 15.18ms | +5.47ms | +36.02% |
| mean | 16.78ms | 14.78ms | +2.01ms | +13.58% |
| min | 14.95ms | 13.77ms | +1.18ms | +8.57% |
| max | 20.98ms | 15.20ms | +5.78ms | +38.01% |
| total | 1006.99ms | 886.57ms | +120.41ms | +13.58% |

### toolLoop

# Perf Report — toolLoop.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 17.94ms |
| p50 | 19.28ms |
| p95 | 20.31ms |
| p99 | 20.76ms |
| mean | 19.32ms |
| stdev | 1.00ms |
| min | 16.72ms |
| max | 21.36ms |
| total | 1159.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 17.94ms | 17.28ms | +0.65ms | +3.78% |
| p50 | 19.28ms | 18.20ms | +1.08ms | +5.93% |
| p95 | 20.31ms | 18.39ms | +1.92ms | +10.41% |
| p99 | 20.76ms | 19.16ms | +1.60ms | +8.37% |
| mean | 19.32ms | 17.95ms | +1.37ms | +7.64% |
| min | 16.72ms | 15.99ms | +0.72ms | +4.53% |
| max | 21.36ms | 19.83ms | +1.53ms | +7.71% |
| total | 1159.17ms | 1076.87ms | +82.30ms | +7.64% |

