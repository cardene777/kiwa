# Perf Suite — ai-llm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| streaming_workload (5 runStream + chunk collect) | 19.84ms | 26.43ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| multi_turn_conversation (10-turn chat + reset) | 0.0099ms | 0.02ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.06ms | 200ms | PASS |
| streaming_workload (5 runStream + chunk collect) | 23.67ms | 200ms | PASS |
| multi_turn_conversation (10-turn chat + reset) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 14104 B | -32860 B | 102400 B | yes | PASS |
| streaming_workload (5 runStream + chunk collect) | -4128 B | -172 B | 102400 B | yes | PASS |
| multi_turn_conversation (10-turn chat + reset) | 600 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_completion (10x runChat + getMetrics)

# Perf Report — chat_completion (10x runChat + getMetrics).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0049ms |
| min | 0.0085ms |
| max | 0.03ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0066ms | +0.0041ms | +62.24% |
| p50 | 0.01ms | 0.0079ms | +0.0053ms | +66.74% |
| p95 | 0.02ms | 0.02ms | +0.0068ms | +40.56% |
| p99 | 0.03ms | 0.02ms | +0.0094ms | +50.89% |
| mean | 0.01ms | 0.01ms | +0.0041ms | +39.44% |
| min | 0.0085ms | 0.0066ms | +0.0020ms | +29.74% |
| max | 0.03ms | 0.02ms | +0.01ms | +53.19% |
| total | 0.29ms | 0.21ms | +0.08ms | +39.44% |

### streaming_workload (5 runStream + chunk collect)

# Perf Report — streaming_workload (5 runStream + chunk collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 19.84ms |
| p50 | 21.44ms |
| p95 | 26.43ms |
| p99 | 29.64ms |
| mean | 22.10ms |
| stdev | 2.70ms |
| min | 19.05ms |
| max | 30.44ms |
| total | 441.98ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 19.84ms | 16.40ms | +3.45ms | +21.01% |
| p50 | 21.44ms | 17.50ms | +3.94ms | +22.53% |
| p95 | 26.43ms | 17.75ms | +8.68ms | +48.87% |
| p99 | 29.64ms | 17.95ms | +11.69ms | +65.09% |
| mean | 22.10ms | 17.26ms | +4.83ms | +28.00% |
| min | 19.05ms | 16.31ms | +2.74ms | +16.81% |
| max | 30.44ms | 18.00ms | +12.44ms | +69.09% |
| total | 441.98ms | 345.28ms | +96.70ms | +28.00% |

### multi_turn_conversation (10-turn chat + reset)

# Perf Report — multi_turn_conversation (10-turn chat + reset).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0099ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0029ms |
| min | 0.0097ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0099ms | 0.0065ms | +0.0035ms | +54.11% |
| p50 | 0.01ms | 0.0067ms | +0.0057ms | +86.23% |
| p95 | 0.02ms | 0.0091ms | +0.01ms | +111.59% |
| p99 | 0.02ms | 0.0099ms | +0.01ms | +112.62% |
| mean | 0.01ms | 0.0071ms | +0.0059ms | +83.22% |
| min | 0.0097ms | 0.0063ms | +0.0034ms | +53.93% |
| max | 0.02ms | 0.01ms | +0.01ms | +112.86% |
| total | 0.26ms | 0.14ms | +0.12ms | +83.22% |

