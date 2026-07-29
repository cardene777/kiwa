# Perf Suite — dogfood-anthropic-chatbot

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| reply | 8.43ms | 9.99ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| replyStream | 14.85ms | 21.12ms | 50ms | 0.00033ms | PASS | stable (p10 +7% (閾値未満)、 p95 +40% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| toolLoop | 17.30ms | 20.02ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| reply | 9.82ms | 60ms | PASS |
| replyStream | 16.91ms | 100ms | PASS |
| toolLoop | 18.57ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| reply | -1368 B | 0 B | 102400 B | yes | PASS |
| replyStream | 4800 B | 0 B | 102400 B | yes | PASS |
| toolLoop | -3544 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### reply

# Perf Report — reply.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.43ms |
| p50 | 9.21ms |
| p95 | 9.99ms |
| p99 | 10.99ms |
| mean | 9.17ms |
| stdev | 0.60ms |
| min | 7.81ms |
| max | 11.50ms |
| total | 550.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.43ms | 8.31ms | +0.11ms | +1.38% |
| p50 | 9.21ms | 9.11ms | +0.10ms | +1.10% |
| p95 | 9.99ms | 9.17ms | +0.83ms | +9.01% |
| p99 | 10.99ms | 9.27ms | +1.72ms | +18.59% |
| mean | 9.17ms | 8.91ms | +0.27ms | +2.99% |
| min | 7.81ms | 8.02ms | -0.21ms | -2.64% |
| max | 11.50ms | 9.34ms | +2.16ms | +23.09% |
| total | 550.48ms | 534.48ms | +16.00ms | +2.99% |

### replyStream

# Perf Report — replyStream.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 14.85ms |
| p50 | 16.37ms |
| p95 | 21.12ms |
| p99 | 25.61ms |
| mean | 16.92ms |
| stdev | 2.51ms |
| min | 13.69ms |
| max | 29.25ms |
| total | 1015.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 14.85ms | 13.94ms | +0.91ms | +6.51% |
| p50 | 16.37ms | 15.01ms | +1.36ms | +9.06% |
| p95 | 21.12ms | 15.12ms | +6.00ms | +39.71% |
| p99 | 25.61ms | 15.18ms | +10.42ms | +68.63% |
| mean | 16.92ms | 14.78ms | +2.14ms | +14.49% |
| min | 13.69ms | 13.77ms | -0.08ms | -0.59% |
| max | 29.25ms | 15.20ms | +14.05ms | +92.46% |
| total | 1015.01ms | 886.57ms | +128.44ms | +14.49% |

### toolLoop

# Perf Report — toolLoop.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 17.30ms |
| p50 | 18.22ms |
| p95 | 20.02ms |
| p99 | 23.31ms |
| mean | 18.37ms |
| stdev | 1.14ms |
| min | 16.68ms |
| max | 23.38ms |
| total | 1102.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 17.30ms | 17.28ms | +0.02ms | +0.12% |
| p50 | 18.22ms | 18.20ms | +0.02ms | +0.10% |
| p95 | 20.02ms | 18.39ms | +1.63ms | +8.88% |
| p99 | 23.31ms | 19.16ms | +4.15ms | +21.65% |
| mean | 18.37ms | 17.95ms | +0.43ms | +2.37% |
| min | 16.68ms | 15.99ms | +0.69ms | +4.30% |
| max | 23.38ms | 19.83ms | +3.55ms | +17.92% |
| total | 1102.39ms | 1076.87ms | +25.52ms | +2.37% |

