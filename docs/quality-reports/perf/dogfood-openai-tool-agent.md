# Perf Suite — dogfood-openai-tool-agent

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| validateToolSchemas | 33.21ms | 36.16ms | 50ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| runToolLoop | 27.95ms | 30.81ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runParallelToolCall | 13.95ms | 15.29ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| validateToolSchemas | cpu | 0.08ms | 33.21ms | 405.031 | 387.762 | 33.82ms | 32.38ms |
| runToolLoop | cpu | 0.08ms | 27.95ms | 335.878 | 319.796 | 27.83ms | 26.50ms |
| runParallelToolCall | cpu | 0.08ms | 13.95ms | 168.276 | 157.572 | 13.99ms | 13.10ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateToolSchemas | 36.43ms | 100ms | PASS |
| runToolLoop | 31.57ms | 200ms | PASS |
| runParallelToolCall | 15.83ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| validateToolSchemas | 3512 B | 0 B | 102400 B | yes | PASS |
| runToolLoop | -19096 B | 0 B | 102400 B | yes | PASS |
| runParallelToolCall | -1888 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### validateToolSchemas

# Perf Report — validateToolSchemas.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 33.21ms |
| p50 | 34.72ms |
| p95 | 36.16ms |
| p99 | 36.23ms |
| mean | 34.62ms |
| stdev | 0.97ms |
| min | 32.13ms |
| max | 36.23ms |
| total | 1384.92ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 33.21ms | 32.38ms | +0.83ms | +2.57% |
| p50 | 34.72ms | 33.24ms | +1.48ms | +4.46% |
| p95 | 36.16ms | 33.58ms | +2.58ms | +7.67% |
| p99 | 36.23ms | 33.95ms | +2.28ms | +6.70% |
| mean | 34.62ms | 33.05ms | +1.57ms | +4.75% |
| min | 32.13ms | 31.74ms | +0.39ms | +1.23% |
| max | 36.23ms | 34.09ms | +2.14ms | +6.27% |
| total | 1384.92ms | 1322.17ms | +62.75ms | +4.75% |

### runToolLoop

# Perf Report — runToolLoop.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 27.95ms |
| p50 | 29.54ms |
| p95 | 30.81ms |
| p99 | 33.50ms |
| mean | 29.51ms |
| stdev | 1.34ms |
| min | 27.13ms |
| max | 35.05ms |
| total | 1180.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 27.95ms | 26.50ms | +1.45ms | +5.46% |
| p50 | 29.54ms | 27.44ms | +2.11ms | +7.68% |
| p95 | 30.81ms | 27.70ms | +3.11ms | +11.21% |
| p99 | 33.50ms | 27.90ms | +5.60ms | +20.06% |
| mean | 29.51ms | 27.27ms | +2.25ms | +8.24% |
| min | 27.13ms | 26.32ms | +0.81ms | +3.08% |
| max | 35.05ms | 28.00ms | +7.05ms | +25.19% |
| total | 1180.60ms | 1090.73ms | +89.87ms | +8.24% |

### runParallelToolCall

# Perf Report — runParallelToolCall.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 13.95ms |
| p50 | 14.42ms |
| p95 | 15.29ms |
| p99 | 15.36ms |
| mean | 14.58ms |
| stdev | 0.53ms |
| min | 13.74ms |
| max | 15.41ms |
| total | 583.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 13.95ms | 13.10ms | +0.85ms | +6.48% |
| p50 | 14.42ms | 13.74ms | +0.68ms | +4.97% |
| p95 | 15.29ms | 14.00ms | +1.28ms | +9.18% |
| p99 | 15.36ms | 14.09ms | +1.27ms | +9.00% |
| mean | 14.58ms | 13.55ms | +1.03ms | +7.62% |
| min | 13.74ms | 12.21ms | +1.53ms | +12.50% |
| max | 15.41ms | 14.10ms | +1.32ms | +9.34% |
| total | 583.19ms | 541.90ms | +41.28ms | +7.62% |

