# Perf Suite — ai-llm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.02ms | 100ms | PASS | stable |
| streaming_workload (5 runStream + chunk collect) | 17.50ms | 100ms | PASS | stable |
| multi_turn_conversation (10-turn chat + reset) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.05ms | 200ms | PASS |
| streaming_workload (5 runStream + chunk collect) | 17.55ms | 200ms | PASS |
| multi_turn_conversation (10-turn chat + reset) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | -14160 B | 0 B | 102400 B | yes | PASS |
| streaming_workload (5 runStream + chunk collect) | 8952 B | 0 B | 102400 B | yes | PASS |
| multi_turn_conversation (10-turn chat + reset) | -14848 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_completion (10x runChat + getMetrics)

# Perf Report — chat_completion (10x runChat + getMetrics).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -13.42% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -5.00% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -9.64% |
| mean | 0.01ms | 0.01ms | -0.00ms | -10.40% |
| min | 0.01ms | 0.01ms | -0.00ms | -29.65% |
| max | 0.02ms | 0.02ms | -0.00ms | -10.71% |
| total | 0.21ms | 0.24ms | -0.02ms | -10.40% |

### streaming_workload (5 runStream + chunk collect)

# Perf Report — streaming_workload (5 runStream + chunk collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 17.24ms |
| p95 | 17.50ms |
| p99 | 17.61ms |
| mean | 16.98ms |
| stdev | 0.54ms |
| min | 16.14ms |
| max | 17.63ms |
| total | 339.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 17.24ms | 16.78ms | +0.47ms | +2.78% |
| p95 | 17.50ms | 17.91ms | -0.40ms | -2.25% |
| p99 | 17.61ms | 17.97ms | -0.36ms | -2.03% |
| mean | 16.98ms | 16.82ms | +0.16ms | +0.94% |
| min | 16.14ms | 15.05ms | +1.09ms | +7.24% |
| max | 17.63ms | 17.99ms | -0.35ms | -1.97% |
| total | 339.53ms | 336.36ms | +3.16ms | +0.94% |

### multi_turn_conversation (10-turn chat + reset)

# Perf Report — multi_turn_conversation (10-turn chat + reset).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +17.86% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +20.54% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +8.65% |
| mean | 0.01ms | 0.01ms | +0.00ms | +16.78% |
| min | 0.01ms | 0.01ms | +0.00ms | +9.80% |
| max | 0.01ms | 0.01ms | +0.00ms | +6.09% |
| total | 0.16ms | 0.14ms | +0.02ms | +16.78% |

