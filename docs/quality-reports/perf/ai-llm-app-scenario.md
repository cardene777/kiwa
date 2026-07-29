# Perf Suite — ai-llm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3096%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| streaming_workload (5 runStream + chunk collect) | 68.60ms | 100ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_turn_conversation (10-turn chat + reset) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +4495%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.06ms | 200ms | PASS |
| streaming_workload (5 runStream + chunk collect) | 24.50ms | 200ms | PASS |
| multi_turn_conversation (10-turn chat + reset) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | -26656 B | -37309 B | 102400 B | yes | PASS |
| streaming_workload (5 runStream + chunk collect) | 9968 B | -167 B | 102400 B | yes | PASS |
| multi_turn_conversation (10-turn chat + reset) | -14888 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +58.98% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +9.97% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -9.86% |
| mean | 0.01ms | 0.01ms | +0.00ms | +50.66% |
| min | 0.01ms | 0.01ms | +0.00ms | +84.67% |
| max | 0.02ms | 0.03ms | -0.01ms | -23.76% |
| total | 0.26ms | 0.90ms | -0.64ms | -70.74% |

### streaming_workload (5 runStream + chunk collect)

# Perf Report — streaming_workload (5 runStream + chunk collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 22.92ms |
| p95 | 68.60ms |
| p99 | 70.50ms |
| mean | 30.25ms |
| stdev | 17.80ms |
| min | 17.19ms |
| max | 70.98ms |
| total | 605.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 22.92ms | 21.24ms | +1.68ms | +7.90% |
| p95 | 68.60ms | 36.37ms | +32.23ms | +88.63% |
| p99 | 70.50ms | 52.06ms | +18.44ms | +35.43% |
| mean | 30.25ms | 24.03ms | +6.23ms | +25.92% |
| min | 17.19ms | 16.60ms | +0.59ms | +3.53% |
| max | 70.98ms | 69.13ms | +1.84ms | +2.67% |
| total | 605.09ms | 2474.68ms | -1869.60ms | -75.55% |

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
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -1.99% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -19.83% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -53.70% |
| mean | 0.01ms | 0.01ms | -0.00ms | -22.59% |
| min | 0.01ms | 0.01ms | +0.00ms | +10.87% |
| max | 0.01ms | 0.15ms | -0.14ms | -93.68% |
| total | 0.15ms | 0.99ms | -0.84ms | -84.97% |

