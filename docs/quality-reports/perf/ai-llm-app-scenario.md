# Perf Suite — ai-llm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.0060ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| streaming_workload (5 runStream + chunk collect) | 17.50ms | 22.42ms | 100ms | 0.00050ms | PASS | stable (p10 +7% (閾値未満)、 p95 +26% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| multi_turn_conversation (10-turn chat + reset) | 0.0068ms | 0.01ms | 100ms | 0.00050ms | PASS | stable (p10 +5% (閾値未満)、 p95 +43% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.10ms | 200ms | PASS |
| streaming_workload (5 runStream + chunk collect) | 17.87ms | 200ms | PASS |
| multi_turn_conversation (10-turn chat + reset) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | -253824 B | 0 B | 102400 B | yes | PASS |
| streaming_workload (5 runStream + chunk collect) | -3136 B | 0 B | 102400 B | yes | PASS |
| multi_turn_conversation (10-turn chat + reset) | 696 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_completion (10x runChat + getMetrics)

# Perf Report — chat_completion (10x runChat + getMetrics).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0060ms |
| p50 | 0.0080ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0098ms |
| stdev | 0.0044ms |
| min | 0.0060ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0060ms | 0.0066ms | -0.00066ms | -10.00% |
| p50 | 0.0080ms | 0.0079ms | +0.00010ms | +1.31% |
| p95 | 0.02ms | 0.02ms | +0.0017ms | +10.35% |
| p99 | 0.02ms | 0.02ms | +0.00042ms | +2.24% |
| mean | 0.0098ms | 0.01ms | -0.00055ms | -5.29% |
| min | 0.0060ms | 0.0066ms | -0.00063ms | -9.51% |
| max | 0.02ms | 0.02ms | +0.000083ms | +0.44% |
| total | 0.20ms | 0.21ms | -0.01ms | -5.29% |

### streaming_workload (5 runStream + chunk collect)

# Perf Report — streaming_workload (5 runStream + chunk collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 17.50ms |
| p50 | 20.44ms |
| p95 | 22.42ms |
| p99 | 22.76ms |
| mean | 20.18ms |
| stdev | 1.94ms |
| min | 16.76ms |
| max | 22.84ms |
| total | 403.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 17.50ms | 16.40ms | +1.10ms | +6.71% |
| p50 | 20.44ms | 17.50ms | +2.94ms | +16.80% |
| p95 | 22.42ms | 17.75ms | +4.67ms | +26.30% |
| p99 | 22.76ms | 17.95ms | +4.81ms | +26.78% |
| mean | 20.18ms | 17.26ms | +2.92ms | +16.90% |
| min | 16.76ms | 16.31ms | +0.45ms | +2.78% |
| max | 22.84ms | 18.00ms | +4.84ms | +26.90% |
| total | 403.65ms | 345.28ms | +58.36ms | +16.90% |

### multi_turn_conversation (10-turn chat + reset)

# Perf Report — multi_turn_conversation (10-turn chat + reset).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0068ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.010ms |
| stdev | 0.0024ms |
| min | 0.0067ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0068ms | 0.0065ms | +0.00033ms | +5.17% |
| p50 | 0.01ms | 0.0067ms | +0.0041ms | +61.56% |
| p95 | 0.01ms | 0.0091ms | +0.0039ms | +42.71% |
| p99 | 0.01ms | 0.0099ms | +0.0040ms | +40.70% |
| mean | 0.010ms | 0.0071ms | +0.0029ms | +41.07% |
| min | 0.0067ms | 0.0063ms | +0.00037ms | +5.90% |
| max | 0.01ms | 0.01ms | +0.0040ms | +40.24% |
| total | 0.20ms | 0.14ms | +0.06ms | +41.07% |

