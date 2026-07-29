# Perf Suite — ai-llm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.0060ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| streaming_workload (5 runStream + chunk collect) | 16.26ms | 17.72ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_turn_conversation (10-turn chat + reset) | 0.0067ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.04ms | 200ms | PASS |
| streaming_workload (5 runStream + chunk collect) | 17.58ms | 200ms | PASS |
| multi_turn_conversation (10-turn chat + reset) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | -1888 B | 0 B | 102400 B | yes | PASS |
| streaming_workload (5 runStream + chunk collect) | -5768 B | 0 B | 102400 B | yes | PASS |
| multi_turn_conversation (10-turn chat + reset) | 600 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_completion (10x runChat + getMetrics)

# Perf Report — chat_completion (10x runChat + getMetrics).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0060ms |
| p50 | 0.0074ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0093ms |
| stdev | 0.0037ms |
| min | 0.0060ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0060ms | 0.0066ms | -0.00058ms | -8.75% |
| p50 | 0.0074ms | 0.0079ms | -0.00046ms | -5.81% |
| p95 | 0.02ms | 0.02ms | -0.00029ms | -1.69% |
| p99 | 0.02ms | 0.02ms | -0.00082ms | -4.44% |
| mean | 0.0093ms | 0.01ms | -0.0011ms | -10.49% |
| min | 0.0060ms | 0.0066ms | -0.00054ms | -8.25% |
| max | 0.02ms | 0.02ms | -0.00096ms | -5.05% |
| total | 0.19ms | 0.21ms | -0.02ms | -10.49% |

### streaming_workload (5 runStream + chunk collect)

# Perf Report — streaming_workload (5 runStream + chunk collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 16.26ms |
| p50 | 17.41ms |
| p95 | 17.72ms |
| p99 | 19.37ms |
| mean | 17.17ms |
| stdev | 0.91ms |
| min | 15.17ms |
| max | 19.78ms |
| total | 343.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 16.26ms | 16.40ms | -0.13ms | -0.81% |
| p50 | 17.41ms | 17.50ms | -0.09ms | -0.50% |
| p95 | 17.72ms | 17.75ms | -0.04ms | -0.20% |
| p99 | 19.37ms | 17.95ms | +1.41ms | +7.87% |
| mean | 17.17ms | 17.26ms | -0.09ms | -0.55% |
| min | 15.17ms | 16.31ms | -1.14ms | -7.00% |
| max | 19.78ms | 18.00ms | +1.78ms | +9.86% |
| total | 343.40ms | 345.28ms | -1.88ms | -0.55% |

### multi_turn_conversation (10-turn chat + reset)

# Perf Report — multi_turn_conversation (10-turn chat + reset).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0067ms |
| p50 | 0.0082ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0085ms |
| stdev | 0.0030ms |
| min | 0.0064ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0067ms | 0.0065ms | +0.00020ms | +3.04% |
| p50 | 0.0082ms | 0.0067ms | +0.0016ms | +23.43% |
| p95 | 0.01ms | 0.0091ms | +0.00096ms | +10.56% |
| p99 | 0.02ms | 0.0099ms | +0.0086ms | +87.21% |
| mean | 0.0085ms | 0.0071ms | +0.0015ms | +20.78% |
| min | 0.0064ms | 0.0063ms | +0.000041ms | +0.65% |
| max | 0.02ms | 0.01ms | +0.01ms | +104.56% |
| total | 0.17ms | 0.14ms | +0.03ms | +20.78% |

