# Perf Suite — ai-llm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.0057ms | 0.01ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| streaming_workload (5 runStream + chunk collect) | 16.22ms | 17.45ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_turn_conversation (10-turn chat + reset) | 0.0070ms | 0.0086ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.04ms | 200ms | PASS |
| streaming_workload (5 runStream + chunk collect) | 17.59ms | 200ms | PASS |
| multi_turn_conversation (10-turn chat + reset) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | -936 B | 0 B | 102400 B | yes | PASS |
| streaming_workload (5 runStream + chunk collect) | -5656 B | 0 B | 102400 B | yes | PASS |
| multi_turn_conversation (10-turn chat + reset) | 600 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_completion (10x runChat + getMetrics)

# Perf Report — chat_completion (10x runChat + getMetrics).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0057ms |
| p50 | 0.0061ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0080ms |
| stdev | 0.0030ms |
| min | 0.0057ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0057ms | 0.0066ms | -0.00087ms | -13.22% |
| p50 | 0.0061ms | 0.0079ms | -0.0018ms | -22.96% |
| p95 | 0.01ms | 0.02ms | -0.0029ms | -17.47% |
| p99 | 0.01ms | 0.02ms | -0.0040ms | -21.70% |
| mean | 0.0080ms | 0.01ms | -0.0024ms | -22.91% |
| min | 0.0057ms | 0.0066ms | -0.00088ms | -13.30% |
| max | 0.01ms | 0.02ms | -0.0043ms | -22.64% |
| total | 0.16ms | 0.21ms | -0.05ms | -22.91% |

### streaming_workload (5 runStream + chunk collect)

# Perf Report — streaming_workload (5 runStream + chunk collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 16.22ms |
| p50 | 17.31ms |
| p95 | 17.45ms |
| p99 | 17.47ms |
| mean | 17.13ms |
| stdev | 0.47ms |
| min | 16.13ms |
| max | 17.47ms |
| total | 342.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 16.22ms | 16.40ms | -0.18ms | -1.07% |
| p50 | 17.31ms | 17.50ms | -0.19ms | -1.06% |
| p95 | 17.45ms | 17.75ms | -0.30ms | -1.68% |
| p99 | 17.47ms | 17.95ms | -0.49ms | -2.72% |
| mean | 17.13ms | 17.26ms | -0.13ms | -0.77% |
| min | 16.13ms | 16.31ms | -0.18ms | -1.13% |
| max | 17.47ms | 18.00ms | -0.53ms | -2.97% |
| total | 342.62ms | 345.28ms | -2.67ms | -0.77% |

### multi_turn_conversation (10-turn chat + reset)

# Perf Report — multi_turn_conversation (10-turn chat + reset).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0070ms |
| p50 | 0.0070ms |
| p95 | 0.0086ms |
| p99 | 0.0088ms |
| mean | 0.0073ms |
| stdev | 0.00053ms |
| min | 0.0069ms |
| max | 0.0088ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0070ms | 0.0065ms | +0.00050ms | +7.81% |
| p50 | 0.0070ms | 0.0067ms | +0.00037ms | +5.62% |
| p95 | 0.0086ms | 0.0091ms | -0.00046ms | -5.02% |
| p99 | 0.0088ms | 0.0099ms | -0.0011ms | -10.74% |
| mean | 0.0073ms | 0.0071ms | +0.00021ms | +2.98% |
| min | 0.0069ms | 0.0063ms | +0.00058ms | +9.19% |
| max | 0.0088ms | 0.01ms | -0.0012ms | -12.03% |
| total | 0.15ms | 0.14ms | +0.0042ms | +2.98% |

