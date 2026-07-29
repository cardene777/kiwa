# Perf Suite — dogfood-anthropic-chatbot

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| reply | 8.26ms | 9.18ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| replyStream | 14.82ms | 18.36ms | 50ms | 0.00033ms | PASS | stable (p10 +6% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| toolLoop | 17.29ms | 18.31ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| reply | 9.26ms | 60ms | PASS |
| replyStream | 15.42ms | 100ms | PASS |
| toolLoop | 18.48ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| reply | -12920 B | 0 B | 102400 B | yes | PASS |
| replyStream | -2592 B | 0 B | 102400 B | yes | PASS |
| toolLoop | -2392 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### reply

# Perf Report — reply.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.26ms |
| p50 | 9.11ms |
| p95 | 9.18ms |
| p99 | 9.37ms |
| mean | 8.96ms |
| stdev | 0.36ms |
| min | 8.00ms |
| max | 9.56ms |
| total | 537.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.26ms | 8.31ms | -0.05ms | -0.64% |
| p50 | 9.11ms | 9.11ms | +0.0042ms | +0.05% |
| p95 | 9.18ms | 9.17ms | +0.01ms | +0.13% |
| p99 | 9.37ms | 9.27ms | +0.11ms | +1.13% |
| mean | 8.96ms | 8.91ms | +0.05ms | +0.58% |
| min | 8.00ms | 8.02ms | -0.02ms | -0.23% |
| max | 9.56ms | 9.34ms | +0.21ms | +2.28% |
| total | 537.58ms | 534.48ms | +3.10ms | +0.58% |

### replyStream

# Perf Report — replyStream.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 14.82ms |
| p50 | 15.06ms |
| p95 | 18.36ms |
| p99 | 18.95ms |
| mean | 15.44ms |
| stdev | 1.20ms |
| min | 12.85ms |
| max | 19.02ms |
| total | 926.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 14.82ms | 13.94ms | +0.88ms | +6.32% |
| p50 | 15.06ms | 15.01ms | +0.05ms | +0.32% |
| p95 | 18.36ms | 15.12ms | +3.24ms | +21.46% |
| p99 | 18.95ms | 15.18ms | +3.77ms | +24.82% |
| mean | 15.44ms | 14.78ms | +0.66ms | +4.46% |
| min | 12.85ms | 13.77ms | -0.93ms | -6.72% |
| max | 19.02ms | 15.20ms | +3.83ms | +25.17% |
| total | 926.15ms | 886.57ms | +39.58ms | +4.46% |

### toolLoop

# Perf Report — toolLoop.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 17.29ms |
| p50 | 18.05ms |
| p95 | 18.31ms |
| p99 | 19.40ms |
| mean | 17.91ms |
| stdev | 0.59ms |
| min | 16.40ms |
| max | 20.94ms |
| total | 1074.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 17.29ms | 17.28ms | +0.0043ms | +0.03% |
| p50 | 18.05ms | 18.20ms | -0.15ms | -0.84% |
| p95 | 18.31ms | 18.39ms | -0.08ms | -0.42% |
| p99 | 19.40ms | 19.16ms | +0.24ms | +1.24% |
| mean | 17.91ms | 17.95ms | -0.03ms | -0.18% |
| min | 16.40ms | 15.99ms | +0.41ms | +2.53% |
| max | 20.94ms | 19.83ms | +1.12ms | +5.63% |
| total | 1074.90ms | 1076.87ms | -1.97ms | -0.18% |

