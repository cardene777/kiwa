# Perf Suite — ai-llm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.01ms | 0.04ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| streaming_workload (5 runStream + chunk collect) | 22.33ms | 56.13ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| multi_turn_conversation (10-turn chat + reset) | 0.0079ms | 0.01ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.06ms | 200ms | PASS |
| streaming_workload (5 runStream + chunk collect) | 27.45ms | 200ms | PASS |
| multi_turn_conversation (10-turn chat + reset) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | -10280 B | -33529 B | 102400 B | yes | PASS |
| streaming_workload (5 runStream + chunk collect) | 10160 B | 0 B | 102400 B | yes | PASS |
| multi_turn_conversation (10-turn chat + reset) | 200 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_completion (10x runChat + getMetrics)

# Perf Report — chat_completion (10x runChat + getMetrics).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0098ms |
| max | 0.08ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0066ms | +0.0036ms | +53.68% |
| p50 | 0.01ms | 0.0079ms | +0.0047ms | +59.89% |
| p95 | 0.04ms | 0.02ms | +0.02ms | +138.18% |
| p99 | 0.07ms | 0.02ms | +0.05ms | +283.33% |
| mean | 0.02ms | 0.01ms | +0.0074ms | +71.79% |
| min | 0.0098ms | 0.0066ms | +0.0032ms | +48.72% |
| max | 0.08ms | 0.02ms | +0.06ms | +315.61% |
| total | 0.36ms | 0.21ms | +0.15ms | +71.79% |

### streaming_workload (5 runStream + chunk collect)

# Perf Report — streaming_workload (5 runStream + chunk collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 22.33ms |
| p50 | 31.61ms |
| p95 | 56.13ms |
| p99 | 59.73ms |
| mean | 34.37ms |
| stdev | 11.77ms |
| min | 20.41ms |
| max | 60.62ms |
| total | 687.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 22.33ms | 16.40ms | +5.93ms | +36.18% |
| p50 | 31.61ms | 17.50ms | +14.11ms | +80.66% |
| p95 | 56.13ms | 17.75ms | +38.38ms | +216.20% |
| p99 | 59.73ms | 17.95ms | +41.77ms | +232.68% |
| mean | 34.37ms | 17.26ms | +17.11ms | +99.10% |
| min | 20.41ms | 16.31ms | +4.10ms | +25.12% |
| max | 60.62ms | 18.00ms | +42.62ms | +236.75% |
| total | 687.46ms | 345.28ms | +342.17ms | +99.10% |

### multi_turn_conversation (10-turn chat + reset)

# Perf Report — multi_turn_conversation (10-turn chat + reset).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0079ms |
| p50 | 0.0091ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0098ms |
| stdev | 0.0033ms |
| min | 0.0077ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0079ms | 0.0065ms | +0.0015ms | +22.92% |
| p50 | 0.0091ms | 0.0067ms | +0.0025ms | +36.87% |
| p95 | 0.01ms | 0.0091ms | +0.0025ms | +27.84% |
| p99 | 0.02ms | 0.0099ms | +0.01ms | +114.08% |
| mean | 0.0098ms | 0.0071ms | +0.0027ms | +38.20% |
| min | 0.0077ms | 0.0063ms | +0.0014ms | +21.69% |
| max | 0.02ms | 0.01ms | +0.01ms | +133.60% |
| total | 0.20ms | 0.14ms | +0.05ms | +38.20% |

