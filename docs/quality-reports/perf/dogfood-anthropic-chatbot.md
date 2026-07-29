# Perf Suite — dogfood-anthropic-chatbot

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| reply | 8.23ms | 9.74ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| replyStream | 14.06ms | 16.12ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| toolLoop | 17.43ms | 18.42ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| reply | 9.56ms | 60ms | PASS |
| replyStream | 17.83ms | 100ms | PASS |
| toolLoop | 18.33ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| reply | -13944 B | 0 B | 102400 B | yes | PASS |
| replyStream | -3168 B | 0 B | 102400 B | yes | PASS |
| toolLoop | -2392 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### reply

# Perf Report — reply.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.23ms |
| p50 | 9.12ms |
| p95 | 9.74ms |
| p99 | 10.59ms |
| mean | 9.01ms |
| stdev | 0.60ms |
| min | 7.15ms |
| max | 10.87ms |
| total | 540.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.23ms | 8.31ms | -0.08ms | -0.95% |
| p50 | 9.12ms | 9.11ms | +0.01ms | +0.15% |
| p95 | 9.74ms | 9.17ms | +0.57ms | +6.23% |
| p99 | 10.59ms | 9.27ms | +1.33ms | +14.33% |
| mean | 9.01ms | 8.91ms | +0.11ms | +1.19% |
| min | 7.15ms | 8.02ms | -0.87ms | -10.84% |
| max | 10.87ms | 9.34ms | +1.53ms | +16.33% |
| total | 540.85ms | 534.48ms | +6.37ms | +1.19% |

### replyStream

# Perf Report — replyStream.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 14.06ms |
| p50 | 15.13ms |
| p95 | 16.12ms |
| p99 | 20.49ms |
| mean | 15.15ms |
| stdev | 1.21ms |
| min | 13.86ms |
| max | 21.81ms |
| total | 909.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 14.06ms | 13.94ms | +0.12ms | +0.85% |
| p50 | 15.13ms | 15.01ms | +0.12ms | +0.78% |
| p95 | 16.12ms | 15.12ms | +1.00ms | +6.62% |
| p99 | 20.49ms | 15.18ms | +5.30ms | +34.92% |
| mean | 15.15ms | 14.78ms | +0.38ms | +2.54% |
| min | 13.86ms | 13.77ms | +0.08ms | +0.62% |
| max | 21.81ms | 15.20ms | +6.62ms | +43.53% |
| total | 909.11ms | 886.57ms | +22.54ms | +2.54% |

### toolLoop

# Perf Report — toolLoop.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 17.43ms |
| p50 | 18.14ms |
| p95 | 18.42ms |
| p99 | 26.35ms |
| mean | 18.24ms |
| stdev | 2.49ms |
| min | 15.55ms |
| max | 36.75ms |
| total | 1094.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 17.43ms | 17.28ms | +0.14ms | +0.83% |
| p50 | 18.14ms | 18.20ms | -0.06ms | -0.32% |
| p95 | 18.42ms | 18.39ms | +0.03ms | +0.17% |
| p99 | 26.35ms | 19.16ms | +7.19ms | +37.54% |
| mean | 18.24ms | 17.95ms | +0.29ms | +1.60% |
| min | 15.55ms | 15.99ms | -0.44ms | -2.78% |
| max | 36.75ms | 19.83ms | +16.92ms | +85.32% |
| total | 1094.13ms | 1076.87ms | +17.26ms | +1.60% |

