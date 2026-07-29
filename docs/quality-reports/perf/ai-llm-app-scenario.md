# Perf Suite — ai-llm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.02ms | 0.04ms | 100ms | 0.0012ms | PASS | regressed — gate 無効 (regressionGate=false) |
| streaming_workload (5 runStream + chunk collect) | 16.39ms | 18.38ms | 100ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_turn_conversation (10-turn chat + reset) | 0.0077ms | 0.01ms | 100ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.06ms | 200ms | PASS |
| streaming_workload (5 runStream + chunk collect) | 20.03ms | 200ms | PASS |
| multi_turn_conversation (10-turn chat + reset) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 15128 B | -32856 B | 102400 B | yes | PASS |
| streaming_workload (5 runStream + chunk collect) | -2320 B | -170 B | 102400 B | yes | PASS |
| multi_turn_conversation (10-turn chat + reset) | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_completion (10x runChat + getMetrics)

# Perf Report — chat_completion (10x runChat + getMetrics).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0097ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.0066ms | +0.0099ms | +150.03% |
| p50 | 0.03ms | 0.0079ms | +0.02ms | +234.01% |
| p95 | 0.04ms | 0.02ms | +0.02ms | +147.64% |
| p99 | 0.05ms | 0.02ms | +0.03ms | +152.90% |
| mean | 0.03ms | 0.01ms | +0.02ms | +157.62% |
| min | 0.01ms | 0.0066ms | +0.0077ms | +116.43% |
| max | 0.05ms | 0.02ms | +0.03ms | +154.07% |
| total | 0.53ms | 0.21ms | +0.33ms | +157.62% |

### streaming_workload (5 runStream + chunk collect)

# Perf Report — streaming_workload (5 runStream + chunk collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 16.39ms |
| p50 | 17.60ms |
| p95 | 18.38ms |
| p99 | 18.53ms |
| mean | 17.40ms |
| stdev | 0.75ms |
| min | 15.76ms |
| max | 18.57ms |
| total | 348.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 16.39ms | 16.40ms | -0.01ms | -0.07% |
| p50 | 17.60ms | 17.50ms | +0.10ms | +0.60% |
| p95 | 18.38ms | 17.75ms | +0.63ms | +3.55% |
| p99 | 18.53ms | 17.95ms | +0.58ms | +3.22% |
| mean | 17.40ms | 17.26ms | +0.14ms | +0.81% |
| min | 15.76ms | 16.31ms | -0.55ms | -3.37% |
| max | 18.57ms | 18.00ms | +0.56ms | +3.14% |
| total | 348.08ms | 345.28ms | +2.80ms | +0.81% |

### multi_turn_conversation (10-turn chat + reset)

# Perf Report — multi_turn_conversation (10-turn chat + reset).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0077ms |
| p50 | 0.0086ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0091ms |
| stdev | 0.0026ms |
| min | 0.0066ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0077ms | 0.0065ms | +0.0012ms | +19.11% |
| p50 | 0.0086ms | 0.0067ms | +0.0020ms | +29.68% |
| p95 | 0.01ms | 0.0091ms | +0.0014ms | +15.81% |
| p99 | 0.02ms | 0.0099ms | +0.0081ms | +82.08% |
| mean | 0.0091ms | 0.0071ms | +0.0021ms | +29.08% |
| min | 0.0066ms | 0.0063ms | +0.00025ms | +3.95% |
| max | 0.02ms | 0.01ms | +0.0097ms | +97.08% |
| total | 0.18ms | 0.14ms | +0.04ms | +29.08% |

