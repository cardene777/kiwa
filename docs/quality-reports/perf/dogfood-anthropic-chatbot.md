# Perf Suite — dogfood-anthropic-chatbot

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| reply | 8.68ms | 10.68ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| replyStream | 13.97ms | 15.45ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| toolLoop | 17.24ms | 18.26ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| reply | 9.57ms | 60ms | PASS |
| replyStream | 15.51ms | 100ms | PASS |
| toolLoop | 18.38ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| reply | 2016 B | 0 B | 102400 B | yes | PASS |
| replyStream | -3240 B | 0 B | 102400 B | yes | PASS |
| toolLoop | -3448 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### reply

# Perf Report — reply.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.68ms |
| p50 | 9.23ms |
| p95 | 10.68ms |
| p99 | 14.35ms |
| mean | 9.53ms |
| stdev | 1.15ms |
| min | 7.60ms |
| max | 14.95ms |
| total | 571.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.68ms | 8.31ms | +0.37ms | +4.44% |
| p50 | 9.23ms | 9.11ms | +0.12ms | +1.30% |
| p95 | 10.68ms | 9.17ms | +1.51ms | +16.45% |
| p99 | 14.35ms | 9.27ms | +5.09ms | +54.90% |
| mean | 9.53ms | 8.91ms | +0.62ms | +6.93% |
| min | 7.60ms | 8.02ms | -0.42ms | -5.21% |
| max | 14.95ms | 9.34ms | +5.61ms | +60.03% |
| total | 571.52ms | 534.48ms | +37.04ms | +6.93% |

### replyStream

# Perf Report — replyStream.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 13.97ms |
| p50 | 15.09ms |
| p95 | 15.45ms |
| p99 | 15.70ms |
| mean | 14.89ms |
| stdev | 0.52ms |
| min | 13.85ms |
| max | 15.70ms |
| total | 893.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 13.97ms | 13.94ms | +0.03ms | +0.21% |
| p50 | 15.09ms | 15.01ms | +0.08ms | +0.51% |
| p95 | 15.45ms | 15.12ms | +0.33ms | +2.17% |
| p99 | 15.70ms | 15.18ms | +0.51ms | +3.37% |
| mean | 14.89ms | 14.78ms | +0.11ms | +0.74% |
| min | 13.85ms | 13.77ms | +0.08ms | +0.59% |
| max | 15.70ms | 15.20ms | +0.50ms | +3.28% |
| total | 893.12ms | 886.57ms | +6.55ms | +0.74% |

### toolLoop

# Perf Report — toolLoop.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 17.24ms |
| p50 | 18.20ms |
| p95 | 18.26ms |
| p99 | 18.28ms |
| mean | 17.90ms |
| stdev | 0.50ms |
| min | 15.99ms |
| max | 18.29ms |
| total | 1073.97ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 17.24ms | 17.28ms | -0.05ms | -0.27% |
| p50 | 18.20ms | 18.20ms | -0.0046ms | -0.03% |
| p95 | 18.26ms | 18.39ms | -0.13ms | -0.71% |
| p99 | 18.28ms | 19.16ms | -0.88ms | -4.57% |
| mean | 17.90ms | 17.95ms | -0.05ms | -0.27% |
| min | 15.99ms | 15.99ms | -0.0063ms | -0.04% |
| max | 18.29ms | 19.83ms | -1.54ms | -7.78% |
| total | 1073.97ms | 1076.87ms | -2.89ms | -0.27% |

