# Perf Suite — ai-llm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.02ms | 100ms | PASS | stable |
| streaming_workload (5 runStream + chunk collect) | 17.36ms | 100ms | PASS | stable |
| multi_turn_conversation (10-turn chat + reset) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.05ms | 200ms | PASS |
| streaming_workload (5 runStream + chunk collect) | 17.44ms | 200ms | PASS |
| multi_turn_conversation (10-turn chat + reset) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 1360 B | 0 B | 102400 B | yes | PASS |
| streaming_workload (5 runStream + chunk collect) | 8840 B | 0 B | 102400 B | yes | PASS |
| multi_turn_conversation (10-turn chat + reset) | -14784 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.01ms | 0.01ms | -0.00ms | -21.65% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -3.07% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +6.56% |
| mean | 0.01ms | 0.01ms | -0.00ms | -10.91% |
| min | 0.01ms | 0.01ms | -0.00ms | -26.55% |
| max | 0.02ms | 0.02ms | +0.00ms | +8.78% |
| total | 0.21ms | 0.24ms | -0.03ms | -10.91% |

### streaming_workload (5 runStream + chunk collect)

# Perf Report — streaming_workload (5 runStream + chunk collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 17.23ms |
| p95 | 17.36ms |
| p99 | 17.36ms |
| mean | 17.08ms |
| stdev | 0.41ms |
| min | 16.08ms |
| max | 17.36ms |
| total | 341.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 17.23ms | 16.78ms | +0.46ms | +2.71% |
| p95 | 17.36ms | 17.91ms | -0.54ms | -3.04% |
| p99 | 17.36ms | 17.97ms | -0.61ms | -3.40% |
| mean | 17.08ms | 16.82ms | +0.26ms | +1.57% |
| min | 16.08ms | 15.05ms | +1.03ms | +6.84% |
| max | 17.36ms | 17.99ms | -0.63ms | -3.48% |
| total | 341.64ms | 336.36ms | +5.28ms | +1.57% |

### multi_turn_conversation (10-turn chat + reset)

# Perf Report — multi_turn_conversation (10-turn chat + reset).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +25.85% |
| p95 | 0.01ms | 0.01ms | +0.01ms | +64.75% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +91.27% |
| mean | 0.01ms | 0.01ms | +0.00ms | +28.77% |
| min | 0.01ms | 0.01ms | -0.00ms | -2.62% |
| max | 0.02ms | 0.01ms | +0.01ms | +96.96% |
| total | 0.18ms | 0.14ms | +0.04ms | +28.77% |

