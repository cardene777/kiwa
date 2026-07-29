# Perf Suite — dogfood-anthropic-chatbot

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| reply | 8.46ms | 9.17ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| replyStream | 13.98ms | 15.44ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| toolLoop | 17.52ms | 18.25ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| reply | 9.23ms | 60ms | PASS |
| replyStream | 15.32ms | 100ms | PASS |
| toolLoop | 18.33ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| reply | -1264 B | 0 B | 102400 B | yes | PASS |
| replyStream | -2536 B | 0 B | 102400 B | yes | PASS |
| toolLoop | -2392 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### reply

# Perf Report — reply.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.46ms |
| p50 | 9.12ms |
| p95 | 9.17ms |
| p99 | 9.19ms |
| mean | 8.96ms |
| stdev | 0.35ms |
| min | 7.50ms |
| max | 9.20ms |
| total | 537.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.46ms | 8.31ms | +0.15ms | +1.81% |
| p50 | 9.12ms | 9.11ms | +0.0096ms | +0.11% |
| p95 | 9.17ms | 9.17ms | -0.00045ms | -0.00% |
| p99 | 9.19ms | 9.27ms | -0.08ms | -0.82% |
| mean | 8.96ms | 8.91ms | +0.05ms | +0.59% |
| min | 7.50ms | 8.02ms | -0.52ms | -6.44% |
| max | 9.20ms | 9.34ms | -0.15ms | -1.59% |
| total | 537.61ms | 534.48ms | +3.13ms | +0.59% |

### replyStream

# Perf Report — replyStream.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 13.98ms |
| p50 | 15.08ms |
| p95 | 15.44ms |
| p99 | 16.03ms |
| mean | 14.99ms |
| stdev | 0.47ms |
| min | 13.88ms |
| max | 16.62ms |
| total | 899.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 13.98ms | 13.94ms | +0.04ms | +0.26% |
| p50 | 15.08ms | 15.01ms | +0.07ms | +0.44% |
| p95 | 15.44ms | 15.12ms | +0.33ms | +2.16% |
| p99 | 16.03ms | 15.18ms | +0.85ms | +5.59% |
| mean | 14.99ms | 14.78ms | +0.22ms | +1.46% |
| min | 13.88ms | 13.77ms | +0.11ms | +0.80% |
| max | 16.62ms | 15.20ms | +1.42ms | +9.36% |
| total | 899.49ms | 886.57ms | +12.92ms | +1.46% |

### toolLoop

# Perf Report — toolLoop.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 17.52ms |
| p50 | 18.20ms |
| p95 | 18.25ms |
| p99 | 18.27ms |
| mean | 18.00ms |
| stdev | 0.34ms |
| min | 17.04ms |
| max | 18.28ms |
| total | 1080.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 17.52ms | 17.28ms | +0.24ms | +1.37% |
| p50 | 18.20ms | 18.20ms | +0.0032ms | +0.02% |
| p95 | 18.25ms | 18.39ms | -0.14ms | -0.76% |
| p99 | 18.27ms | 19.16ms | -0.89ms | -4.65% |
| mean | 18.00ms | 17.95ms | +0.05ms | +0.30% |
| min | 17.04ms | 15.99ms | +1.05ms | +6.58% |
| max | 18.28ms | 19.83ms | -1.54ms | -7.79% |
| total | 1080.15ms | 1076.87ms | +3.28ms | +0.30% |

