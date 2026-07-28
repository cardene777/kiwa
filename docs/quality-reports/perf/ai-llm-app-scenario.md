# Perf Suite — ai-llm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3096%) 以上の悪化が必要) |
| streaming_workload (5 runStream + chunk collect) | 20.77ms | 100ms | PASS | improved |
| multi_turn_conversation (10-turn chat + reset) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +4495%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.05ms | 200ms | PASS |
| streaming_workload (5 runStream + chunk collect) | 18.85ms | 200ms | PASS |
| multi_turn_conversation (10-turn chat + reset) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | -8944 B | 0 B | 102400 B | yes | PASS |
| streaming_workload (5 runStream + chunk collect) | -5440 B | 0 B | 102400 B | yes | PASS |
| multi_turn_conversation (10-turn chat + reset) | -16528 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.01ms | 0.01ms | +0.00ms | +10.88% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +6.91% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -0.45% |
| mean | 0.01ms | 0.01ms | +0.00ms | +20.24% |
| min | 0.01ms | 0.01ms | +0.00ms | +32.24% |
| max | 0.02ms | 0.03ms | -0.00ms | -13.68% |
| total | 0.21ms | 0.90ms | -0.69ms | -76.65% |

### streaming_workload (5 runStream + chunk collect)

# Perf Report — streaming_workload (5 runStream + chunk collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 17.42ms |
| p95 | 20.77ms |
| p99 | 22.97ms |
| mean | 18.08ms |
| stdev | 1.63ms |
| min | 16.39ms |
| max | 23.52ms |
| total | 361.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 17.42ms | 21.24ms | -3.82ms | -17.97% |
| p95 | 20.77ms | 36.37ms | -15.60ms | -42.90% |
| p99 | 22.97ms | 52.06ms | -29.09ms | -55.87% |
| mean | 18.08ms | 24.03ms | -5.95ms | -24.76% |
| min | 16.39ms | 16.60ms | -0.21ms | -1.26% |
| max | 23.52ms | 69.13ms | -45.61ms | -65.97% |
| total | 361.55ms | 2474.68ms | -2113.14ms | -85.39% |

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
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -12.78% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -0.56% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -14.43% |
| mean | 0.01ms | 0.01ms | -0.00ms | -22.89% |
| min | 0.01ms | 0.01ms | -0.00ms | -0.69% |
| max | 0.02ms | 0.15ms | -0.13ms | -87.44% |
| total | 0.15ms | 0.99ms | -0.84ms | -85.03% |

