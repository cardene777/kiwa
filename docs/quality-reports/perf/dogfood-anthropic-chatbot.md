# Perf Suite — dogfood-anthropic-chatbot

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| reply | 8.50ms | 10.02ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| replyStream | 14.29ms | 16.54ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| toolLoop | 17.51ms | 19.10ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| reply | 10.38ms | 60ms | PASS |
| replyStream | 17.45ms | 100ms | PASS |
| toolLoop | 18.58ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| reply | -1296 B | 0 B | 102400 B | yes | PASS |
| replyStream | -3984 B | 0 B | 102400 B | yes | PASS |
| toolLoop | -3544 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### reply

# Perf Report — reply.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.50ms |
| p50 | 9.15ms |
| p95 | 10.02ms |
| p99 | 12.54ms |
| mean | 9.20ms |
| stdev | 0.75ms |
| min | 8.16ms |
| max | 12.76ms |
| total | 551.94ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.50ms | 8.31ms | +0.18ms | +2.22% |
| p50 | 9.15ms | 9.11ms | +0.04ms | +0.46% |
| p95 | 10.02ms | 9.17ms | +0.85ms | +9.32% |
| p99 | 12.54ms | 9.27ms | +3.27ms | +35.33% |
| mean | 9.20ms | 8.91ms | +0.29ms | +3.27% |
| min | 8.16ms | 8.02ms | +0.14ms | +1.79% |
| max | 12.76ms | 9.34ms | +3.41ms | +36.51% |
| total | 551.94ms | 534.48ms | +17.46ms | +3.27% |

### replyStream

# Perf Report — replyStream.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 14.29ms |
| p50 | 15.25ms |
| p95 | 16.54ms |
| p99 | 17.40ms |
| mean | 15.20ms |
| stdev | 0.80ms |
| min | 12.85ms |
| max | 17.43ms |
| total | 911.91ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 14.29ms | 13.94ms | +0.35ms | +2.53% |
| p50 | 15.25ms | 15.01ms | +0.23ms | +1.56% |
| p95 | 16.54ms | 15.12ms | +1.43ms | +9.43% |
| p99 | 17.40ms | 15.18ms | +2.21ms | +14.58% |
| mean | 15.20ms | 14.78ms | +0.42ms | +2.86% |
| min | 12.85ms | 13.77ms | -0.92ms | -6.70% |
| max | 17.43ms | 15.20ms | +2.23ms | +14.68% |
| total | 911.91ms | 886.57ms | +25.34ms | +2.86% |

### toolLoop

# Perf Report — toolLoop.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 17.51ms |
| p50 | 18.23ms |
| p95 | 19.10ms |
| p99 | 21.32ms |
| mean | 18.21ms |
| stdev | 0.85ms |
| min | 15.97ms |
| max | 21.87ms |
| total | 1092.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 17.51ms | 17.28ms | +0.23ms | +1.32% |
| p50 | 18.23ms | 18.20ms | +0.03ms | +0.18% |
| p95 | 19.10ms | 18.39ms | +0.71ms | +3.87% |
| p99 | 21.32ms | 19.16ms | +2.16ms | +11.25% |
| mean | 18.21ms | 17.95ms | +0.26ms | +1.45% |
| min | 15.97ms | 15.99ms | -0.02ms | -0.12% |
| max | 21.87ms | 19.83ms | +2.05ms | +10.32% |
| total | 1092.45ms | 1076.87ms | +15.59ms | +1.45% |

