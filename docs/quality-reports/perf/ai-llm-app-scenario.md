# Perf Suite — ai-llm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.0062ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| streaming_workload (5 runStream + chunk collect) | 16.33ms | 17.59ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_turn_conversation (10-turn chat + reset) | 0.0069ms | 0.01ms | 100ms | 0.00049ms | PASS | stable (p10 +7% (閾値未満)、 p95 +51% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.04ms | 200ms | PASS |
| streaming_workload (5 runStream + chunk collect) | 17.63ms | 200ms | PASS |
| multi_turn_conversation (10-turn chat + reset) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | -178152 B | 0 B | 102400 B | yes | PASS |
| streaming_workload (5 runStream + chunk collect) | -4408 B | 0 B | 102400 B | yes | PASS |
| multi_turn_conversation (10-turn chat + reset) | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_completion (10x runChat + getMetrics)

# Perf Report — chat_completion (10x runChat + getMetrics).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0062ms |
| p50 | 0.0087ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0094ms |
| stdev | 0.0039ms |
| min | 0.0061ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0062ms | 0.0066ms | -0.00045ms | -6.86% |
| p50 | 0.0087ms | 0.0079ms | +0.00077ms | +9.75% |
| p95 | 0.02ms | 0.02ms | -0.0014ms | -8.51% |
| p99 | 0.02ms | 0.02ms | +0.0014ms | +7.80% |
| mean | 0.0094ms | 0.01ms | -0.00095ms | -9.18% |
| min | 0.0061ms | 0.0066ms | -0.00050ms | -7.61% |
| max | 0.02ms | 0.02ms | +0.0022ms | +11.43% |
| total | 0.19ms | 0.21ms | -0.02ms | -9.18% |

### streaming_workload (5 runStream + chunk collect)

# Perf Report — streaming_workload (5 runStream + chunk collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 16.33ms |
| p50 | 17.43ms |
| p95 | 17.59ms |
| p99 | 17.62ms |
| mean | 17.24ms |
| stdev | 0.60ms |
| min | 15.18ms |
| max | 17.63ms |
| total | 344.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 16.33ms | 16.40ms | -0.07ms | -0.44% |
| p50 | 17.43ms | 17.50ms | -0.07ms | -0.38% |
| p95 | 17.59ms | 17.75ms | -0.16ms | -0.89% |
| p99 | 17.62ms | 17.95ms | -0.33ms | -1.85% |
| mean | 17.24ms | 17.26ms | -0.03ms | -0.17% |
| min | 15.18ms | 16.31ms | -1.13ms | -6.91% |
| max | 17.63ms | 18.00ms | -0.38ms | -2.08% |
| total | 344.70ms | 345.28ms | -0.58ms | -0.17% |

### multi_turn_conversation (10-turn chat + reset)

# Perf Report — multi_turn_conversation (10-turn chat + reset).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0069ms |
| p50 | 0.0084ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0087ms |
| stdev | 0.0024ms |
| min | 0.0065ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0069ms | 0.0065ms | +0.00045ms | +6.98% |
| p50 | 0.0084ms | 0.0067ms | +0.0017ms | +25.30% |
| p95 | 0.01ms | 0.0091ms | +0.0047ms | +51.46% |
| p99 | 0.02ms | 0.0099ms | +0.0061ms | +62.28% |
| mean | 0.0087ms | 0.0071ms | +0.0017ms | +23.44% |
| min | 0.0065ms | 0.0063ms | +0.00021ms | +3.28% |
| max | 0.02ms | 0.01ms | +0.0065ms | +64.73% |
| total | 0.17ms | 0.14ms | +0.03ms | +23.44% |

